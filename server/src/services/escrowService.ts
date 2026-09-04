// server/src/services/escrowService.ts
// ========================================
// Double Escrow Business Logic (Atomic CAS Protected)
// This service contains ALL the core Kindr transaction logic.
// Used by routes/transactions.ts
// ========================================
import { User } from '../models/User';
import { Product } from '../models/Product';
import { Transaction, TransactionStatus } from '../models/Transaction';
import { Notification } from '../models/Notification';
import { emitToUser } from '../socket';
import { sendPushToUser } from './pushNotificationService';

/**
 * Calculate Safe Fee (10% of price, minimum 1 Xu, charity = 0)
 */
export function calculateSafeFee(price: number, category: string): number {
  if (price === 0 || category === 'charity' || category === 'tu_thien') return 0;
  return Math.max(1, Math.ceil(price * 0.1));
}

/**
 * Create a new escrow transaction with Atomic Compare-and-Swap (CAS).
 * Guarantees zero double-spending & race conditions even under extreme concurrent requests.
 * Steps:
 * 1. Verify product availability & ownership
 * 2. Check buyer balance
 * 3. Atomic CAS lock on Product status ('available' -> 'escrow')
 * 4. Atomic deduction on Buyer (xuBalance -> xuFrozen)
 * 5. Create Transaction record with 6-character Handover Code
 * 6. Notify seller in real-time
 */
export async function createEscrow(buyerId: string, productId: string): Promise<{
  success: boolean;
  transaction?: any;
  error?: string;
}> {
  // 1. Get product for price & ownership check
  const rawProduct = await Product.findById(productId);
  if (!rawProduct) return { success: false, error: 'Sản phẩm không tồn tại.' };
  if (rawProduct.sellerId.toString() === buyerId) return { success: false, error: 'Không thể tự mua đồ của mình.' };
  if (rawProduct.status !== 'available') return { success: false, error: 'Sản phẩm đã được đổi hoặc không khả dụng.' };

  // 2. Check buyer balance and lock status
  const buyer = await User.findById(buyerId);
  if (!buyer) return { success: false, error: 'Tài khoản người mua không tồn tại.' };
  if (buyer.isLocked) return { success: false, error: 'Tài khoản đang bị khóa.' };
  if (buyer.xuBalance < rawProduct.price) {
    return { success: false, error: `Không đủ Xu. Cần ${rawProduct.price} Xu, hiện có ${buyer.xuBalance} Xu.` };
  }

  // 3. Atomic CAS lock on Product status
  const product = await Product.findOneAndUpdate(
    { _id: productId, status: 'available' },
    { $set: { status: 'escrow' } },
    { new: true }
  );
  if (!product) {
    return { success: false, error: 'Sản phẩm đã được đổi hoặc không khả dụng.' };
  }

  // 4. Atomic deduction on Buyer
  const updatedBuyer = await User.findOneAndUpdate(
    { _id: buyerId, xuBalance: { $gte: product.price }, isLocked: { $ne: true } },
    { $inc: { xuBalance: -product.price, xuFrozen: product.price } },
    { new: true }
  );

  if (!updatedBuyer) {
    // Rollback product status if buyer's balance changed concurrently
    await Product.findByIdAndUpdate(productId, { $set: { status: 'available' } });
    return { success: false, error: `Không đủ Xu. Cần ${product.price} Xu.` };
  }

  // 5. Get seller
  const seller = await User.findById(product.sellerId);
  if (!seller) {
    // Rollback both
    await Product.findByIdAndUpdate(productId, { $set: { status: 'available' } });
    await User.findByIdAndUpdate(buyerId, { $inc: { xuBalance: product.price, xuFrozen: -product.price } });
    return { success: false, error: 'Người bán không tồn tại.' };
  }

  // 6. Generate unique 6-character Handover Code & QR Payload
  const handoverCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  const qrCodePayload = `KINDR|TX:${Date.now()}|${product._id}|${buyer._id}|${seller._id}|CODE:${handoverCode}`;

  // 7. Create Transaction record
  const tx = await Transaction.create({
    productId: product._id,
    productName: product.name,
    productImage: product.image,
    productPrice: product.price,
    buyerId: buyer._id,
    buyerName: buyer.name,
    buyerPhone: buyer.phone,
    buyerZalo: buyer.phone,
    sellerId: seller._id,
    sellerName: seller.name,
    sellerPhone: seller.phone,
    sellerZalo: seller.phone,
    buyerEscrowFrozen: product.price,
    sellerEscrowFrozen: product.safeFeeLocked,
    status: 'awaiting_handover',
    qrCodePayload,
    handoverCode,
  });

  // 8. Notify seller in real-time
  const notif = await Notification.create({
    userId: seller._id,
    type: 'match_request',
    title: 'Có mẹ vừa chọn đổi đồ của bạn! ❤️',
    body: `${buyer.name} vừa bấm đổi món: ${product.name}. Mã nhận đồ: ${handoverCode}. Kiểm tra liên hệ để hẹn gặp nhé!`,
    relatedTransactionId: tx._id,
    relatedProductId: product._id,
  });

  emitToUser(seller._id.toString(), 'notification_new', notif);
  sendPushToUser(seller._id, {
    title: notif.title,
    body: notif.body,
    data: { type: 'match_request', transactionId: tx._id.toString() },
  }).catch(() => {});

  return { success: true, transaction: tx };
}

/**
 * Confirm handover → Start 6h Safeful Time.
 * Idempotent & supports verifying 6-character handover PIN code.
 */
export async function confirmHandover(
  transactionId: string,
  userId: string,
  handoverCodeInput?: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  const existingTx = await Transaction.findById(transactionId);
  if (!existingTx) return { success: false, error: 'Giao dịch không tồn tại.' };
  if (existingTx.status !== 'awaiting_handover') return { success: false, error: 'Trạng thái giao dịch không hợp lệ.' };

  // Either buyer or seller can confirm handover
  if (existingTx.buyerId.toString() !== userId && existingTx.sellerId.toString() !== userId) {
    return { success: false, error: 'Không có quyền thao tác.' };
  }

  // If a handover code is provided, verify it matches
  if (handoverCodeInput && existingTx.handoverCode) {
    if (handoverCodeInput.trim().toUpperCase() !== existingTx.handoverCode.toUpperCase()) {
      return { success: false, error: 'Mã xác nhận bàn giao không chính xác.' };
    }
  }

  const sixHoursLater = new Date(Date.now() + 6 * 60 * 60 * 1000);
  const tx = await Transaction.findOneAndUpdate(
    { _id: transactionId, status: 'awaiting_handover' },
    {
      $set: {
        status: 'in_safeful_time',
        handoverTime: new Date(),
        safefulTimeExpiresAt: sixHoursLater,
      },
    },
    { new: true }
  );

  if (!tx) return { success: false, error: 'Giao dịch không ở trạng thái chờ bàn giao.' };

  // Notify buyer
  const buyerNotif = await Notification.create({
    userId: tx.buyerId,
    type: 'safeful_time_started',
    title: 'Đã kích hoạt 6 Giờ Kiểm Định! ⏱️',
    body: `Bạn có 6 tiếng kiểm tra đồ "${tx.productName}" tại nhà. Nếu có lỗi ẩn, hãy bấm Khiếu nại nhé!`,
    relatedTransactionId: tx._id,
  });
  emitToUser(tx.buyerId.toString(), 'notification_new', buyerNotif);
  sendPushToUser(tx.buyerId, {
    title: buyerNotif.title,
    body: buyerNotif.body,
    data: { type: 'safeful_time_started', transactionId: tx._id.toString() },
  }).catch(() => {});

  // Notify seller
  const sellerNotif = await Notification.create({
    userId: tx.sellerId,
    type: 'safeful_time_started',
    title: 'Người mua đã nhận hàng! 📦',
    body: `Khung giờ 6h kiểm định tại nhà bắt đầu. Xu sẽ tự động giải phóng khi hết 6 giờ.`,
    relatedTransactionId: tx._id,
  });
  emitToUser(tx.sellerId.toString(), 'notification_new', sellerNotif);
  sendPushToUser(tx.sellerId, {
    title: sellerNotif.title,
    body: sellerNotif.body,
    data: { type: 'safeful_time_started', transactionId: tx._id.toString() },
  }).catch(() => {});

  return { success: true };
}

/**
 * Auto-finalize after 6h Safeful Time expires.
 */
export async function autoFinalize(transactionId: string): Promise<void> {
  const tx = await Transaction.findById(transactionId);
  if (!tx || tx.status !== 'in_safeful_time') return;

  // Check if 6h has actually passed
  if (tx.safefulTimeExpiresAt && new Date() < tx.safefulTimeExpiresAt) return;

  await finalizeTransaction(transactionId);
}

/**
 * Finalize transaction → Release all Xu to seller.
 * Idempotent & Atomic: Prevents double crediting Xu if called concurrently.
 */
export async function finalizeTransaction(transactionId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  // Atomic CAS: Only finalize if status is 'in_safeful_time' or 'awaiting_handover'
  const tx = await Transaction.findOneAndUpdate(
    { _id: transactionId, status: { $in: ['in_safeful_time', 'awaiting_handover'] } },
    { $set: { status: 'completed', finalizedAt: new Date() } },
    { new: false } // Get the original to know frozen amounts
  );
  if (!tx) return { success: false, error: 'Giao dịch không tồn tại hoặc đã được xử lý hoàn tất trước đó.' };

  // Release Xu: buyer escrow → seller balance, seller SafeFee → seller balance
  const totalXuToSeller = tx.buyerEscrowFrozen + tx.sellerEscrowFrozen;

  await User.findByIdAndUpdate(tx.sellerId, {
    $inc: {
      xuBalance: totalXuToSeller,
      xuFrozen: -tx.sellerEscrowFrozen,
    },
  });

  await User.findByIdAndUpdate(tx.buyerId, {
    $inc: { xuFrozen: -tx.buyerEscrowFrozen },
  });

  // Update product status
  await Product.findByIdAndUpdate(tx.productId, { status: 'completed' });

  // Notify seller
  const sellerNotif = await Notification.create({
    userId: tx.sellerId,
    type: 'xu_released',
    title: 'Giao dịch hoàn tất! Xu đã vào ví 🟡',
    body: `Hệ thống đã giải phóng ${totalXuToSeller} Xu vào ví của mẹ. Đừng quên đánh giá nhé!`,
    relatedTransactionId: tx._id,
  });
  emitToUser(tx.sellerId.toString(), 'notification_new', sellerNotif);
  sendPushToUser(tx.sellerId, {
    title: sellerNotif.title,
    body: sellerNotif.body,
    data: { type: 'xu_released', transactionId: tx._id.toString() },
  }).catch(() => {});

  // Notify buyer
  const buyerNotif = await Notification.create({
    userId: tx.buyerId,
    type: 'xu_released',
    title: 'Giao dịch thành công! 🎉',
    body: `Cảm ơn mẹ đã sử dụng Kindr. Hãy dành 30s đánh giá cho ${tx.sellerName} nhé!`,
    relatedTransactionId: tx._id,
  });
  emitToUser(tx.buyerId.toString(), 'notification_new', buyerNotif);
  sendPushToUser(tx.buyerId, {
    title: buyerNotif.title,
    body: buyerNotif.body,
    data: { type: 'trade_completed', transactionId: tx._id.toString() },
  }).catch(() => {});

  return { success: true };
}

/**
 * File dispute → Freeze all, open dispute.
 */
export async function fileDispute(
  transactionId: string,
  buyerId: string,
  reason: string,
  evidenceImages: string[] = []
): Promise<{ success: boolean; error?: string }> {
  const tx = await Transaction.findById(transactionId);
  if (!tx) return { success: false, error: 'Giao dịch không tồn tại.' };
  if (tx.buyerId.toString() !== buyerId) return { success: false, error: 'Chỉ người mua mới được khiếu nại.' };
  if (tx.status !== 'in_safeful_time') return { success: false, error: 'Chỉ khiếu nại được trong 6h Safeful Time.' };

  tx.status = 'disputed';
  tx.disputeReason = reason;
  tx.disputeEvidenceImages = evidenceImages;
  tx.disputeStatus = 'open';
  await tx.save();

  // Notify seller
  const notif = await Notification.create({
    userId: tx.sellerId,
    type: 'dispute_opened',
    title: 'Có khiếu nại mới cho đơn hàng! ⚠️',
    body: `Người mua đã báo lỗi món "${tx.productName}". Đội ngũ Kindr đang kiểm tra chứng cứ.`,
    relatedTransactionId: tx._id,
  });
  emitToUser(tx.sellerId.toString(), 'notification_new', notif);
  sendPushToUser(tx.sellerId, {
    title: notif.title,
    body: notif.body,
    data: { type: 'dispute_opened', transactionId: tx._id.toString() },
  }).catch(() => {});

  return { success: true };
}

/**
 * Resolve dispute → Either refund buyer or complete to seller.
 * Idempotent: Only resolves once if status is 'disputed'.
 */
export async function resolveDispute(
  transactionId: string,
  outcome: 'resolved_buyer' | 'resolved_seller'
): Promise<{ success: boolean; error?: string }> {
  const tx = await Transaction.findOneAndUpdate(
    { _id: transactionId, status: 'disputed' },
    {
      $set: {
        status: outcome === 'resolved_buyer' ? 'refunded' : 'completed',
        disputeStatus: outcome,
        finalizedAt: new Date(),
      },
    },
    { new: false }
  );
  if (!tx) return { success: false, error: 'Giao dịch không tồn tại hoặc không ở trạng thái khiếu nại.' };

  if (outcome === 'resolved_buyer') {
    // Refund buyer's escrow, confiscate seller's SafeFee
    await User.findByIdAndUpdate(tx.buyerId, {
      $inc: { xuBalance: tx.buyerEscrowFrozen, xuFrozen: -tx.buyerEscrowFrozen },
    });
    // Seller loses SafeFee
    await User.findByIdAndUpdate(tx.sellerId, {
      $inc: {
        xuFrozen: -tx.sellerEscrowFrozen,
        civilizationPoints: -15,
        disputeStrikeCount: 1,
      },
    });
    // Update Product status
    await Product.findByIdAndUpdate(tx.productId, { status: 'cancelled' });

    // Push notification to buyer
    const buyerNotif = await Notification.create({
      userId: tx.buyerId,
      type: 'dispute_resolved',
      title: 'Khiếu nại được chấp thuận! ✅',
      body: `BQT Kindr đã hoàn trả ${tx.buyerEscrowFrozen} Xu vào ví của mẹ cho đơn "${tx.productName}".`,
      relatedTransactionId: tx._id,
    });
    emitToUser(tx.buyerId.toString(), 'notification_new', buyerNotif);

    // Push notification to seller
    const sellerNotif = await Notification.create({
      userId: tx.sellerId,
      type: 'dispute_resolved',
      title: 'Kết quả giải quyết khiếu nại ⚠️',
      body: `Khiếu nại đơn "${tx.productName}" đã được xử lý: Khấu trừ Safe Fee và hoàn Xu cho người mua.`,
      relatedTransactionId: tx._id,
    });
    emitToUser(tx.sellerId.toString(), 'notification_new', sellerNotif);
  } else {
    // Seller wins: complete as normal
    const totalXu = tx.buyerEscrowFrozen + tx.sellerEscrowFrozen;
    await User.findByIdAndUpdate(tx.sellerId, {
      $inc: { xuBalance: totalXu, xuFrozen: -tx.sellerEscrowFrozen },
    });
    await User.findByIdAndUpdate(tx.buyerId, {
      $inc: { xuFrozen: -tx.buyerEscrowFrozen },
    });
    await Product.findByIdAndUpdate(tx.productId, { status: 'completed' });

    // Push notification to seller
    const sellerNotif = await Notification.create({
      userId: tx.sellerId,
      type: 'dispute_resolved',
      title: 'Khiếu nại đã giải quyết! 🎉',
      body: `BQT Kindr xác nhận đồ đạt chuẩn. Đã giải ngân ${totalXu} Xu vào ví của mẹ.`,
      relatedTransactionId: tx._id,
    });
    emitToUser(tx.sellerId.toString(), 'notification_new', sellerNotif);
  }

  return { success: true };
}
