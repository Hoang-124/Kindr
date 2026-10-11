import cron from 'node-cron';
import { Transaction } from '../models/Transaction';
import { TopupOrder } from '../models/TopupOrder';
import * as escrowService from './escrowService';

/**
 * Initialize background cron jobs for Kindr.
 * 1. Double Escrow 6-Hour Safeful Time auto-finalizer:
 *    Scans for transactions in 'in_safeful_time' status whose timer has elapsed
 *    without dispute and automatically releases Xu to the seller.
 * 2. Topup Orders Stale Expirer:
 *    Scans for topup orders in 'pending' status older than 24 hours and marks them as 'expired'.
 */
export function initCronJobs(): void {
  // Run every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      const now = new Date();
      const expiredTxs = await Transaction.find({
        status: 'in_safeful_time',
        safefulTimeExpiresAt: { $lte: now },
      });

      if (expiredTxs.length > 0) {
        console.log(`⏰ [CRON] Found ${expiredTxs.length} transactions passing 6h Safeful Time. Auto-finalizing...`);

        for (const tx of expiredTxs) {
          try {
            const result = await escrowService.finalizeTransaction(tx._id.toString());
            if (result.success) {
              console.log(`✅ [CRON] Auto-finalized tx: ${tx._id} (Product: ${tx.productName})`);
            } else {
              console.warn(`⚠️ [CRON] Failed to auto-finalize tx ${tx._id}: ${result.error}`);
            }
          } catch (txErr) {
            console.error(`❌ [CRON] Error auto-finalizing tx ${tx._id}:`, txErr);
          }
        }
      }
    } catch (error) {
      console.error('❌ [CRON] Error running escrow auto-finalizer:', error);
    }
  });

  // Run every 30 minutes: Expire pending topup orders > 24 hours
  cron.schedule('*/30 * * * *', async () => {
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const res = await TopupOrder.updateMany(
        {
          status: 'pending',
          createdAt: { $lte: twentyFourHoursAgo },
        },
        {
          $set: { status: 'expired' },
        }
      );
      if (res.modifiedCount > 0) {
        console.log(`⏰ [CRON] Expired ${res.modifiedCount} stale pending topup orders (>24h).`);
      }
    } catch (error) {
      console.error('❌ [CRON] Error expiring stale topup orders:', error);
    }
  });

  console.log('⏰ Background Cron Jobs initialized (Double Escrow 6h Auto-Finalizer & 24h Order Expirer active)');
}
