// server/src/seed/seed.ts
// ========================================
// Database Seeder — Run: npm run seed
// Creates demo data matching the frontend hardcoded data.
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

const DEFAULT_PASSWORD = '123456';

async function seed() {
  await connectDB();
  console.log('🌱 Seeding database...');

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Product.deleteMany({}),
    Transaction.deleteMany({}),
    Chat.deleteMany({}),
    Message.deleteMany({}),
    Notification.deleteMany({}),
  ]);

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  // ---- Create Users ----
  const [meHoaLan, meBap, meNgocAnh, meDauDau] = await User.insertMany([
    {
      name: 'Mẹ Hoa Lan',
      phone: '0905123456',
      email: 'hoalan@gmail.com',
      passwordHash,
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA-IBwqPJodx0bhjMMtWBnEumH7CeEcHYYNiqYBjoUEkj_qabxH1ALcHtHutYeWwIptQR6GxxKV7gTwxdAEB3hciMyjSGBfED7xp6UB8CFORG2YOpZQx5ImXldDdbnBtebM5tpxgqEdV0vGy0z2q6krWUFnknd7cSIscsvGP5vbVKlpI_qOK0MHnQ2yvj2GjFvoylJnNRCIfge7nU2T6bJ-Zzxre4lB1WjZvVBBJA1b1MyLen5e6NqPzVFRFeh-l9kmMfDOe5rIhOGQ',
      location: { districtId: 'dn_haichau', districtName: 'Quận Hải Châu', addressDetail: '123 Trần Phú' },
      xuBalance: 35,
      welcomeCreditRemaining: 10,
      civilizationPoints: 98,
      tradesCount: 12,
      reputationScore: 4.9,
      ratingCount: 12,
      historyPoints: [
        { pointsChanged: 5, reason: 'Giao hàng đúng hẹn cho Mẹ Bắp', date: new Date(Date.now() - 86400000 * 2) },
        { pointsChanged: 3, reason: 'Tặng đồ 0 Xu tại Trạm từ thiện', date: new Date(Date.now() - 86400000 * 5) },
      ],
    },
    {
      name: 'Mẹ Bắp',
      phone: '0905234567',
      email: 'mebap@gmail.com',
      passwordHash,
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDEymEhhOzQ94Wb75d90oia7jzn7EW3FrnOW69g4JOwMYfnuF8a5ZkOPeLopzXieitglTsgKuVJav8unMM6YsBFfr5CSqZZ3lCsFzz0aAqzNfwkCPXLDCeU8XYzTcw4CO1_ldMzPO6Yx5T_-zuXnRIGUxZwfeCAsM8UCgUmwWlCtvS-VGpM2Vz3lZ1D3l6OHRhMnWQAvNc2QQccfdEAfp2FGTYfu-FT8j7PAb2d2-IXGqBuqkKYMTDjzCzwAY_JE_c8ArC19QFm3Api',
      location: { districtId: 'dn_thanhkhe', districtName: 'Quận Thanh Khê', addressDetail: '45 Lê Duẩn' },
      xuBalance: 25,
      welcomeCreditRemaining: 10,
      civilizationPoints: 95,
      tradesCount: 8,
      reputationScore: 4.7,
      ratingCount: 8,
      historyPoints: [
        { pointsChanged: 5, reason: 'Đăng đồ chất lượng cao (like new)', date: new Date(Date.now() - 86400000) },
      ],
    },
    {
      name: 'Mẹ Ngọc Ánh',
      phone: '0905345678',
      email: 'ngocanh@gmail.com',
      passwordHash,
      avatar: '',
      location: { districtId: 'dn_sontra', districtName: 'Quận Sơn Trà', addressDetail: '78 Ngô Quyền' },
      xuBalance: 50,
      welcomeCreditRemaining: 10,
      civilizationPoints: 100,
      tradesCount: 24,
      reputationScore: 5.0,
      ratingCount: 24,
      historyPoints: [
        { pointsChanged: 10, reason: 'Tài khoản uy tín văn minh 5 sao', date: new Date(Date.now() - 86400000 * 10) },
      ],
    },
    {
      name: 'Mẹ Dâu Dâu',
      phone: '0905456789',
      email: 'daudau@gmail.com',
      passwordHash,
      avatar: '',
      location: { districtId: 'dn_haichau', districtName: 'Quận Hải Châu', addressDetail: '15 Lê Lợi' },
      xuBalance: 20,
      welcomeCreditRemaining: 10,
      civilizationPoints: 90,
      tradesCount: 5,
      reputationScore: 4.5,
      ratingCount: 5,
      historyPoints: [
        { pointsChanged: 90, reason: 'Chào mừng gia nhập cộng đồng Kindr', date: new Date(Date.now() - 86400000 * 30) },
      ],
    },
    {
      name: 'Ban Quản Trị Kindr',
      phone: '0900000000',
      email: 'admin@kindr.vn',
      passwordHash,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      location: { districtId: 'dn_haichau', districtName: 'Quận Hải Châu', addressDetail: 'Tòa nhà FPT, Đà Nẵng' },
      xuBalance: 1000,
      welcomeCreditRemaining: 0,
      civilizationPoints: 100,
      tradesCount: 99,
      reputationScore: 5.0,
      ratingCount: 99,
      role: 'admin',
      historyPoints: [
        { pointsChanged: 100, reason: 'Tài khoản Quản Trị Viên Hệ Thống', date: new Date() },
      ],
    },
  ]);

  console.log(`✅ Created users + 1 Admin (password: ${DEFAULT_PASSWORD})`);

  // ---- Create Products ----
  const products = await Product.insertMany([
    {
      name: 'Đồ chơi gỗ Montessori Luồn hạt đa giác phát triển trí não',
      price: 4,
      condition: '90',
      conditionLabel: 'Mới 90% (Rất mới)',
      category: 'do_choi',
      ageRange: '1-3y',
      locationName: 'P. Thạch Thang, Q. Hải Châu, Đà Nẵng',
      wardId: 'hc_thachthang',
      districtId: 'dn_haichau',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBTJXjwnrZcS6bvtvVGWEi2tgqKWa9ZUihAtwHbDF5FHJ6SmwQevjLyXaXIrAtfdPiKD0X3NB8cA7OmXnMoPqOEk0J7Vubi1HernCg11sY9BXocOex5JLEZlMpLtn5Z6FLZ67i3zxsXqXPy0mNHhJcwSB0R298mme5On8ZjDhGjixiZ6XkIxFJo7NCSfiC0XQ9WTCxEsnlR60ZCnXJLogV3_crlu1T1VegS8ic5aO3E0KNBGS6AlejNMMEUv80oWWGHpKasRTY4RXuw',
      description: 'Bộ luồn hạt gỗ tự nhiên sơn an toàn không mùi, các hạt gỗ nhẵn bóng không có dằm.',
      sellerId: meHoaLan._id,
      sellerName: meHoaLan.name,
      sellerAvatar: meHoaLan.avatar,
      sellerPhone: meHoaLan.phone,
      safeFeeLocked: 1,
      status: 'available',
    },
    {
      name: 'Set 3 bộ body suit cộc tay Nous Organic Cotton size 3-6m',
      price: 5,
      condition: '90',
      conditionLabel: 'Mới 90% (Rất mới)',
      category: 'quan_ao',
      ageRange: '0-6m',
      locationName: 'P. Vĩnh Trung, Q. Thanh Khê, Đà Nẵng',
      wardId: 'tk_vinhtrung',
      districtId: 'dn_thanhkhe',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDEymEhhOzQ94Wb75d90oia7jzn7EW3FrnOW69g4JOwMYfnuF8a5ZkOPeLopzXieitglTsgKuVJav8unMM6YsBFfr5CSqZZ3lCsFzz0aAqzNfwkCPXLDCeU8XYzTcw4CO1_ldMzPO6Yx5T_-zuXnRIGUxZwfeCAsM8UCgUmwWlCtvS-VGpM2Vz3lZ1D3l6OHRhMnWQAvNc2QQccfdEAfp2FGTYfu-FT8j7PAb2d2-IXGqBuqkKYMTDjzCzwAY_JE_c8ArC19QFm3Api',
      description: 'Set body Nous vải sợi tre siêu thoáng mát. Bé trộm vía tăng cân nhanh nên mặc được 2 tuần là chật.',
      sellerId: meBap._id,
      sellerName: meBap.name,
      sellerAvatar: meBap.avatar,
      sellerPhone: meBap.phone,
      safeFeeLocked: 1,
      status: 'available',
    },
    {
      name: 'Xe chòi chân hình chú Khủng Long có nhạc và đèn',
      price: 8,
      condition: '80',
      conditionLabel: 'Mới 80% (Khá mới)',
      category: 'xe_noi',
      ageRange: '1-3y',
      locationName: 'P. Hòa Cường Nam, Q. Hải Châu, Đà Nẵng',
      wardId: 'hc_hoacuongnam',
      districtId: 'dn_haichau',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuANOLsCSalwMcYcWe9FNd4D55rDvkWPu9nHQmZvr6PfJxVeBLAd1GB_A6_J3F8MMqY7sSjQu0sz6zgzC8ira9emnmdaz_dQGA1GAmvLgmbV0-vD6f-ewb3btYBawd1zxmRyMWAGs6eNKJ_knhalEEZ3fwKkqQTuouEsqSiFWbqK5TyS6bjikxAeFhcTda-d7pWzNlhqnRFety2Eh7WP9H5QBKoJ3z1Jy_0gyTW3T8JGOaR4CVN-eOZeihrr5xgqWrof4AMo76oqRqeK',
      description: 'Xe chòi chân nhựa đúc nguyên khối chịu lực 30kg, bánh xe chống trượt êm ái.',
      sellerId: meNgocAnh._id,
      sellerName: meNgocAnh.name,
      sellerAvatar: meNgocAnh.avatar || '',
      sellerPhone: meNgocAnh.phone,
      safeFeeLocked: 1,
      status: 'available',
    },
    {
      name: 'Bộ sách vải Lalala Baby 6 cuốn kích thích giác quan',
      price: 3,
      condition: '80',
      conditionLabel: 'Mới 80% (Khá mới)',
      category: 'sach_truyen',
      ageRange: '0-6m',
      locationName: 'P. Mỹ An, Q. Ngũ Hành Sơn, Đà Nẵng',
      wardId: 'nhs_myan',
      districtId: 'dn_nguhanhson',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCHLm7v1mrikcPBK320JSApGO85xBmOXjFLT-iASjSP3fSYUgLSRRmzhHjw9zxoQbzRtW_96jdRqPdEB2bgCgOF6oNN4yqphf9Her3dQ_YkIZjANWvtkDjfhO3rKTfJEEUssk6PG20LxQRsxuLLxf5GfCXqn_RpKi2ImHQc-ZqgkicshoXurNiiEZzReeFfdkb_O7-ulQ1G_ArHN8q-8QJN92rwT2Cio4oSD59_H5htNFcQj3beQ99lH0DLyzcjgYJ27i08arcO4ahC',
      description: 'Sách vải có sột soạt, bế bé gặm an toàn. Giặt máy được nhiều lần.',
      sellerId: meDauDau._id,
      sellerName: meDauDau.name,
      sellerAvatar: meDauDau.avatar || '',
      sellerPhone: meDauDau.phone,
      safeFeeLocked: 1,
      status: 'available',
    },
  ]);

  console.log(`✅ Created ${products.length} products`);

  // ---- Create a demo completed transaction ----
  const demoTx = await Transaction.create({
    productId: products[1]._id,
    productName: products[1].name,
    productImage: products[1].image,
    productPrice: products[1].price,
    buyerId: meHoaLan._id,
    buyerName: meHoaLan.name,
    buyerPhone: meHoaLan.phone,
    sellerId: meBap._id,
    sellerName: meBap.name,
    sellerPhone: meBap.phone,
    buyerEscrowFrozen: 5,
    sellerEscrowFrozen: 1,
    status: 'completed',
    finalizedAt: new Date(Date.now() - 86400000 * 1.9),
    qrCodePayload: `KINDR|TX:DEMO|${products[1]._id}`,
    buyerRated: true,
    sellerRated: true,
  });

  // ---- Create demo chat ----
  const demoChat = await Chat.create({
    productId: products[1]._id,
    productName: products[1].name,
    productImage: products[1].image,
    buyerId: meHoaLan._id,
    buyerName: meHoaLan.name,
    sellerId: meBap._id,
    sellerName: meBap.name,
    lastMessageText: 'Giao dịch đã hoàn tất tốt đẹp! Cảm ơn mẹ nhé!',
    lastMessageTime: new Date(Date.now() - 3600000 * 24),
  });

  await Message.insertMany([
    { chatId: demoChat._id, senderId: meHoaLan._id, senderName: meHoaLan.name, content: 'Chào mẹ Bắp, bộ nous này còn mới không ạ?', createdAt: new Date(Date.now() - 3600000 * 25) },
    { chatId: demoChat._id, senderId: meBap._id, senderName: meBap.name, content: 'Dạ còn mới lắm mẹ ơi, bé nhà mình trộm vía tăng cân nhanh nên mặc chật. Mình giặt cất tủ thôi.', createdAt: new Date(Date.now() - 3600000 * 24.8) },
    { chatId: demoChat._id, senderId: meHoaLan._id, senderName: meHoaLan.name, content: 'Vậy mình gửi yêu cầu nhận đồ qua Trạm tạm khóa Kindr nhé.', createdAt: new Date(Date.now() - 3600000 * 24.5) },
    { chatId: demoChat._id, senderId: meBap._id, senderName: meBap.name, content: 'Ok mẹ nè, mình đã duyệt và bàn giao rồi đó.', createdAt: new Date(Date.now() - 3600000 * 24.2) },
    { chatId: demoChat._id, senderId: meHoaLan._id, senderName: meHoaLan.name, content: 'Giao dịch đã hoàn tất tốt đẹp! Cảm ơn mẹ nhé!', createdAt: new Date(Date.now() - 3600000 * 24) },
  ]);

  // ---- Create notifications ----
  await Notification.insertMany([
    {
      userId: meHoaLan._id,
      type: 'welcome_credit',
      title: 'Chào mừng Mẹ Hoa Lan! 🎈',
      body: 'Kindr đã gửi tặng Mẹ 10 Xu chào mừng vào ví. Hãy bắt đầu đổi quà cho bé ngay nào!',
      createdAt: new Date(Date.now() - 86400000),
    },
    {
      userId: meHoaLan._id,
      type: 'xu_released',
      title: 'Giao dịch thành công! 🎉',
      body: `Đổi đồ "${products[1].name}" thành công. Hãy đánh giá cho ${meBap.name} nhé!`,
      relatedTransactionId: demoTx._id,
      createdAt: new Date(Date.now() - 3600000 * 2),
    },
  ]);

  console.log(`✅ Created 1 demo transaction, 1 chat, 5 messages, 2 notifications`);
  console.log('\n🎉 Database seeded successfully!');
  console.log(`\n📱 Demo accounts (all password: ${DEFAULT_PASSWORD}):`);
  console.log(`   Mẹ Hoa Lan: 0905123456`);
  console.log(`   Mẹ Bắp:     0905234567`);
  console.log(`   Mẹ Ngọc Ánh: 0905345678`);
  console.log(`   Mẹ Dâu Dâu: 0905456789`);

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((error) => {
  console.error('Seed error:', error);
  process.exit(1);
});
