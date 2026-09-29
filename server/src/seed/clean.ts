// server/src/seed/clean.ts
// ========================================
// Database Cleaner — Reset demo data, keep admin & real accounts
// Run: npm run clean
// ========================================
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from '../config/db';
import { User } from '../models/User';
import { Product } from '../models/Product';
import { Transaction } from '../models/Transaction';
import { Chat } from '../models/Chat';
import { Message } from '../models/Message';
import { Notification } from '../models/Notification';
import { TopupOrder } from '../models/TopupOrder';
import { WithdrawRequest } from '../models/WithdrawRequest';
import { Rating } from '../models/Rating';
import { Report } from '../models/Report';

const DEFAULT_ADMIN_PASSWORD = '123456';

async function clean() {
  await connectDB();
  console.log('🧹 Clearing all sample/demo data from Kindr database...');

  // 1. Delete all sample products, transactions, chats, messages, notifications, orders, requests, ratings, reports
  const [
    productsRes,
    txRes,
    chatsRes,
    msgsRes,
    notiRes,
    topupRes,
    withdrawRes,
    ratingRes,
    reportRes,
  ] = await Promise.all([
    Product.deleteMany({}),
    Transaction.deleteMany({}),
    Chat.deleteMany({}),
    Message.deleteMany({}),
    Notification.deleteMany({}),
    TopupOrder.deleteMany({}),
    WithdrawRequest.deleteMany({}),
    Rating.deleteMany({}),
    Report.deleteMany({}),
  ]);

  console.log(`🗑️  Deleted:`);
  console.log(`   - Products: ${productsRes.deletedCount}`);
  console.log(`   - Transactions: ${txRes.deletedCount}`);
  console.log(`   - Chats: ${chatsRes.deletedCount}`);
  console.log(`   - Messages: ${msgsRes.deletedCount}`);
  console.log(`   - Notifications: ${notiRes.deletedCount}`);
  console.log(`   - TopUp Orders: ${topupRes.deletedCount}`);
  console.log(`   - Withdraw Requests: ${withdrawRes.deletedCount}`);
  console.log(`   - Ratings: ${ratingRes.deletedCount}`);
  console.log(`   - Reports: ${reportRes.deletedCount}`);

  // 2. Delete sample demo users from seed
  const demoPhones = ['0905123456', '0905234567', '0905345678', '0905456789'];
  const demoEmails = ['hoalan@gmail.com', 'ngocanh@gmail.com', 'daudau@gmail.com'];
  
  const userDeleteRes = await User.deleteMany({
    $or: [
      { phone: { $in: demoPhones } },
      { email: { $in: demoEmails } },
    ],
  });
  console.log(`   - Demo Users removed: ${userDeleteRes.deletedCount}`);

  // 3. Ensure System Admin exists & is properly configured
  let admin = await User.findOne({
    $or: [{ phone: '0900000000' }, { email: 'admin@kindr.vn' }],
  });

  const passwordHash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);

  if (!admin) {
    admin = await User.create({
      name: 'Ban Quản Trị Kindr',
      phone: '0900000000',
      email: 'admin@kindr.vn',
      passwordHash,
      avatar: '',
      location: { districtId: 'dn_haichau', districtName: 'Quận Hải Châu', addressDetail: 'Tòa nhà FPT, Đà Nẵng' },
      xuBalance: 1000,
      xuFrozen: 0,
      welcomeCreditRemaining: 0,
      civilizationPoints: 100,
      tradesCount: 0,
      reputationScore: 5.0,
      ratingCount: 0,
      role: 'admin',
      isActivated: true,
      historyPoints: [
        { pointsChanged: 100, reason: 'Tài khoản Quản Trị Viên Hệ Thống', date: new Date() },
      ],
    });
    console.log(`👑 Created default Admin account: 0900000000 / admin@kindr.vn (pass: ${DEFAULT_ADMIN_PASSWORD})`);
  } else {
    admin.role = 'admin';
    admin.xuFrozen = 0;
    admin.tradesCount = 0;
    admin.ratingCount = 0;
    admin.passwordHash = passwordHash;
    await admin.save();
    console.log(`👑 Preserved & updated Admin account: ${admin.phone || admin.email}`);
  }

  // 4. Reset frozen balance and counts for remaining real users
  const remainingUsers = await User.find({});
  for (const user of remainingUsers) {
    if (user.role !== 'admin') {
      user.xuFrozen = 0;
      user.tradesCount = 0;
      user.ratingCount = 0;
      user.reputationScore = 5.0;
      if (user.xuBalance < 10) {
        user.xuBalance = 10; // Ensure minimum 10 Xu for posting/testing
      }
      await user.save();
    }
  }

  console.log(`\n✅ Clean complete! Remaining accounts in database:`);
  for (const u of remainingUsers) {
    console.log(`   - [${u.role.toUpperCase()}] ${u.name} (Phone: ${u.phone || 'N/A'}, Email: ${u.email || 'N/A'}, Xu: ${u.xuBalance}, Frozen: ${u.xuFrozen})`);
  }

  console.log('\n🚀 Database is now 100% clean and ready for real post & exchange data!');
  await mongoose.disconnect();
  process.exit(0);
}

clean().catch((error) => {
  console.error('Clean error:', error);
  process.exit(1);
});
