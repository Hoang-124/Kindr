// server/src/services/landingWalletStore.ts
import fs from 'fs';
import path from 'path';

export interface LandingTransaction {
  id: string;
  orderCode?: number;
  type: 'TOPUP' | 'INITIAL' | 'ESCROW_LOCK' | 'ESCROW_RELEASE' | 'REFUND';
  xuAmount: number;
  vndAmount?: number;
  status: 'PENDING' | 'PAID' | 'COMPLETED' | 'CANCELLED';
  description: string;
  createdAt: string;
  paidAt?: string;
}

export interface LandingWallet {
  clientId: string;
  availableXu: number;
  escrowXu: number;
  totalXu: number;
  transactions: LandingTransaction[];
  orders: Record<number, any>;
  updatedAt: string;
}

interface WalletDB {
  wallets: Record<string, LandingWallet>;
}

const DATA_DIR = path.resolve(__dirname, '../../data');
const WALLETS_FILE = path.join(DATA_DIR, 'wallets.json');

// Ensure directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (e) {
    console.warn('Cannot create data dir:', e);
  }
}

function loadDB(): WalletDB {
  try {
    if (fs.existsSync(WALLETS_FILE)) {
      const raw = fs.readFileSync(WALLETS_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Error reading wallets.json, initializing empty db:', err);
  }
  return { wallets: {} };
}

function saveDB(db: WalletDB): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(WALLETS_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving wallets.json:', err);
  }
}

/**
 * Get or create wallet for clientId (defaults to 100 availableXu, 0 escrowXu)
 */
export function getOrCreateWallet(clientId: string): LandingWallet {
  const db = loadDB();
  const id = clientId || 'guest_default';

  if (!db.wallets[id]) {
    db.wallets[id] = {
      clientId: id,
      availableXu: 100,
      escrowXu: 0,
      totalXu: 100,
      transactions: [
        {
          id: `tx_${Date.now()}_init`,
          type: 'INITIAL',
          xuAmount: 100,
          status: 'COMPLETED',
          description: 'Quà tặng chào mừng trải nghiệm KinDr (+100 Xu)',
          createdAt: new Date().toISOString(),
        },
      ],
      orders: {},
      updatedAt: new Date().toISOString(),
    };
    saveDB(db);
  }

  return db.wallets[id];
}

/**
 * Save pending order to wallet
 */
export function recordWalletOrder(clientId: string, order: any): void {
  const db = loadDB();
  const wallet = getOrCreateWallet(clientId);
  wallet.orders[order.orderCode] = order;
  wallet.updatedAt = new Date().toISOString();
  db.wallets[wallet.clientId] = wallet;
  saveDB(db);
}

/**
 * Find wallet by orderCode
 */
export function findWalletByOrderCode(orderCode: number): LandingWallet | null {
  const db = loadDB();
  for (const w of Object.values(db.wallets)) {
    if (w.orders && w.orders[orderCode]) {
      return w;
    }
  }
  return null;
}

/**
 * Complete topup order atomically for landing wallet
 */
export function completeLandingTopup(
  orderCode: number,
  paidAtDate: Date = new Date()
): { success: boolean; wallet?: LandingWallet; alreadyPaid?: boolean; xuAmount?: number } {
  const db = loadDB();
  let foundWallet: LandingWallet | null = null;

  for (const w of Object.values(db.wallets)) {
    if (w.orders && w.orders[orderCode]) {
      foundWallet = w;
      break;
    }
  }

  if (!foundWallet) {
    return { success: false };
  }

  const order = foundWallet.orders[orderCode];
  if (order.status === 'PAID') {
    return { success: true, wallet: foundWallet, alreadyPaid: true, xuAmount: order.xuAmount };
  }

  // Update order
  order.status = 'PAID';
  order.paidAt = paidAtDate.toISOString();
  foundWallet.orders[orderCode] = order;

  // Credit available balance
  const xu = Number(order.xuAmount) || 0;
  foundWallet.availableXu += xu;
  foundWallet.totalXu = foundWallet.availableXu + foundWallet.escrowXu;
  foundWallet.updatedAt = new Date().toISOString();

  // Add ledger transaction
  foundWallet.transactions.unshift({
    id: `tx_${Date.now()}_${orderCode}`,
    orderCode,
    type: 'TOPUP',
    xuAmount: xu,
    vndAmount: order.vndAmount || xu * 1000,
    status: 'PAID',
    description: `Nạp Xu PayOS VietQR (+${xu} Xu)`,
    createdAt: new Date().toISOString(),
    paidAt: paidAtDate.toISOString(),
  });

  db.wallets[foundWallet.clientId] = foundWallet;
  saveDB(db);

  return { success: true, wallet: foundWallet, alreadyPaid: false, xuAmount: xu };
}

/**
 * Escrow lock action (when simulated exchange is triggered)
 */
export function updateEscrowLock(clientId: string, lockAmount: number = 50): LandingWallet {
  const db = loadDB();
  const wallet = getOrCreateWallet(clientId);

  if (wallet.availableXu >= lockAmount) {
    wallet.availableXu -= lockAmount;
    wallet.escrowXu += lockAmount;
    wallet.totalXu = wallet.availableXu + wallet.escrowXu;
    wallet.transactions.unshift({
      id: `tx_${Date.now()}_escrow_lock`,
      type: 'ESCROW_LOCK',
      xuAmount: -lockAmount,
      status: 'COMPLETED',
      description: `Tạm khóa ký quỹ bảo chứng Escrow (-${lockAmount} Xu)`,
      createdAt: new Date().toISOString(),
    });
    wallet.updatedAt = new Date().toISOString();
    db.wallets[wallet.clientId] = wallet;
    saveDB(db);
  }

  return wallet;
}

