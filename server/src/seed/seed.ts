// server/src/seed/seed.ts
// ========================================
// Database Seeder — Run: npm run seed
// Creates comprehensive demo data for Mobile & Web apps.
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
import { Rating } from '../models/Rating';
import { Category } from '../models/Category';

const DEFAULT_PASSWORD = '123456';

async function seed() {
  await connectDB();
  console.log('🌱 Seeding database...');

  await Promise.all([
    User.deleteMany({}),
    Product.deleteMany({}),
    Transaction.deleteMany({}),
    Chat.deleteMany({}),
    Message.deleteMany({}),
    Notification.deleteMany({}),
    Rating.deleteMany({}),
    Category.deleteMany({}),
  ]);

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  // ---- Create Categories ----
  await Category.insertMany([
    { name: 'Đồ chơi nhỏ', code: 'toy_small', icon: 'ToyBrick' },
    { name: 'Đồ chơi lớn', code: 'toy_large', icon: 'Gamepad2' },
    { name: 'Sách truyện & Ehon', code: 'book', icon: 'BookOpen' },
    { name: 'Quần áo bé', code: 'quan_ao', icon: 'Shirt' },
    { name: 'Xe đẩy & Nôi cũi', code: 'xe_noi', icon: 'Baby' },
    { name: 'Đồ dùng học tập', code: 'do_hoc_tap', icon: 'GraduationCap' },
    { name: 'Trạm Tặng Đồ 0 Xu', code: 'charity', icon: 'Gift' },
  ]);

  // ---- Create Users ----
  const [meHoaLan, meBap, meNgocAnh, meDauDau, adminUser] = await User.insertMany([
    {
      name: 'Mẹ Hoa Lan',
      phone: '0905123456',
      email: 'hoalan@kindr.vn',
      passwordHash,
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
      bio: 'Mẹ bé Sóc 2 tuổi tại Hải Châu, Đà Nẵng. Yêu thích đồ chơi gỗ Montessori & sách Ehon Nhật Bản.',
      location: { districtId: 'dn_haichau', districtName: 'Quận Hải Châu', addressDetail: '123 Trần Phú, Hải Châu' },
      xuBalance: 45,
      welcomeCreditRemaining: 10,
      civilizationPoints: 98,
      tradesCount: 14,
      reputationScore: 4.9,
      ratingCount: 14,
      isActivated: true,
      historyPoints: [
        { pointsChanged: 2, reason: 'Nhận đánh giá 5 sao từ Mẹ Bắp', date: new Date(Date.now() - 86400000 * 1) },
        { pointsChanged: 1, reason: 'Hoàn tất giao dịch đúng hẹn với Mẹ Bắp', date: new Date(Date.now() - 86400000 * 2) },
        { pointsChanged: 2, reason: 'Tặng đồ 0 Xu tại Trạm Tặng Đồ Kindr', date: new Date(Date.now() - 86400000 * 5) },
      ],
    },
    {
      name: 'Mẹ Bắp',
      phone: '0905234567',
      email: 'mebap@kindr.vn',
      passwordHash,
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80',
      bio: 'Mẹ bé Bắp 8 tháng tuổi tại Thanh Khê. Thường xuyên dọn tủ quần áo Nous, BiboMart còn rất mới.',
      location: { districtId: 'dn_thankhe', districtName: 'Quận Thanh Khê', addressDetail: '45 Lê Duẩn, Thanh Khê' },
      xuBalance: 35,
      welcomeCreditRemaining: 10,
      civilizationPoints: 96,
      tradesCount: 9,
      reputationScore: 4.8,
      ratingCount: 9,
      isActivated: true,
      historyPoints: [
        { pointsChanged: 1, reason: 'Giao dịch thành công qua Bảo Chứng Kép', date: new Date(Date.now() - 86400000) },
      ],
    },
    {
      name: 'Mẹ Ngọc Ánh',
      phone: '0905345678',
      email: 'ngocanh@kindr.vn',
      passwordHash,
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80',
      bio: 'Đại sứ Mẹ Bỉm Văn Minh Sơn Trà, Đà Nẵng. Cam kết đồ sạch đẹp đã khử khuẩn UV.',
      location: { districtId: 'dn_sontra', districtName: 'Quận Sơn Trà', addressDetail: '78 Ngô Quyền, Sơn Trà' },
      xuBalance: 60,
      welcomeCreditRemaining: 10,
      civilizationPoints: 100,
      tradesCount: 24,
      reputationScore: 5.0,
      ratingCount: 24,
      isActivated: true,
      historyPoints: [
        { pointsChanged: 5, reason: 'Đạt danh hiệu Đại Sứ Văn Minh 100/100', date: new Date(Date.now() - 86400000 * 10) },
      ],
    },
    {
      name: 'Mẹ Dâu Dâu',
      phone: '0905456789',
      email: 'daudau@kindr.vn',
      passwordHash,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
      bio: 'Mẹ 2 bé tại KĐT FPT City, Ngũ Hành Sơn. Chuyên chia sẻ sách vải và đồ dùng học tập.',
      location: { districtId: 'dn_nguhanhson', districtName: 'Quận Ngũ Hành Sơn', addressDetail: 'Tòa FPT Plaza 2, Ngũ Hành Sơn' },
      xuBalance: 30,
      welcomeCreditRemaining: 10,
      civilizationPoints: 95,
      tradesCount: 6,
      reputationScore: 4.9,
      ratingCount: 6,
      isActivated: true,
      historyPoints: [
        { pointsChanged: 95, reason: 'Chào mừng gia nhập cộng đồng Kindr', date: new Date(Date.now() - 86400000 * 30) },
      ],
    },
    {
      name: 'Ban Quản Trị Kindr',
      phone: '0900000000',
      email: 'admin@kindr.vn',
      passwordHash,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80',
      bio: 'Trọng tài Bảo Chứng Kép & Quản trị viên Hệ sinh thái Kindr Đà Nẵng.',
      location: { districtId: 'dn_haichau', districtName: 'Quận Hải Châu', addressDetail: 'Tòa nhà FPT, Đà Nẵng' },
      xuBalance: 1000,
      welcomeCreditRemaining: 0,
      civilizationPoints: 100,
      tradesCount: 99,
      reputationScore: 5.0,
      ratingCount: 99,
      role: 'admin',
      isActivated: true,
      historyPoints: [
        { pointsChanged: 100, reason: 'Tài khoản Quản Trị Viên Hệ Thống', date: new Date() },
      ],
    },
  ]);

  console.log(`✅ Created 5 users (password: ${DEFAULT_PASSWORD})`);

  // ---- Create 8 Rich Products across all categories ----
  const products = await Product.insertMany([
    {
      name: 'Đồ chơi gỗ Montessori Luồn hạt đa giác phát triển trí não',
      price: 4,
      condition: '90',
      conditionLabel: 'Mới 90% (Rất mới)',
      category: 'do_choi',
      ageRange: '1-3 tuổi',
      locationName: 'P. Thạch Thang, Q. Hải Châu, Đà Nẵng',
      wardId: 'hc_thachthang',
      districtId: 'dn_haichau',
      coordinates: { latitude: 16.0748, longitude: 108.2215 },
      image: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800&auto=format&fit=crop&q=80',
      additionalImages: [
        'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800&auto=format&fit=crop&q=80',
      ],
      description: 'Bộ luồn hạt gỗ tự nhiên sơn gốc nước an toàn không mùi, các hạt gỗ nhẵn bóng không có dằm. Bé nhà mình chơi rất giữ gìn, còn nguyên hộp.',
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
      ageRange: '0-12 tháng',
      locationName: 'P. Vĩnh Trung, Q. Thanh Khê, Đà Nẵng',
      wardId: 'tk_vinhzhong',
      districtId: 'dn_thankhe',
      coordinates: { latitude: 16.0642, longitude: 108.1912 },
      image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&auto=format&fit=crop&q=80',
      additionalImages: [
        'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=800&auto=format&fit=crop&q=80',
      ],
      description: 'Set body Nous vải sợi tre siêu thoáng mát, thấm hút mồ hôi. Bé trộm vía tăng cân nhanh nên chỉ mặc 2 tuần là chật, đã giặt nước giặt hữu cơ thơm tho.',
      sellerId: meBap._id,
      sellerName: meBap.name,
      sellerAvatar: meBap.avatar,
      sellerPhone: meBap.phone,
      safeFeeLocked: 1,
      status: 'available',
    },
    {
      name: 'Xe chòi chân hình chú Khủng Long có nhạc và đèn LED',
      price: 8,
      condition: '80',
      conditionLabel: 'Mới 80% (Khá mới)',
      category: 'xe_noi',
      ageRange: '1-3 tuổi',
      locationName: 'P. An Hải Bắc, Q. Sơn Trà, Đà Nẵng',
      wardId: 'st_anhai',
      districtId: 'dn_sontra',
      coordinates: { latitude: 16.0785, longitude: 108.2385 },
      image: 'https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?w=800&auto=format&fit=crop&q=80',
      description: 'Xe chòi chân nhựa đúc nguyên khối chịu lực 30kg, bánh xe chống trượt êm ái không gây xước sàn gỗ. Nhạc và đèn hoạt động hoàn hảo.',
      sellerId: meNgocAnh._id,
      sellerName: meNgocAnh.name,
      sellerAvatar: meNgocAnh.avatar,
      sellerPhone: meNgocAnh.phone,
      safeFeeLocked: 1,
      status: 'available',
    },
    {
      name: 'Bộ sách vải Lalala Baby 6 cuốn kích thích đa giác quan',
      price: 2,
      condition: '90',
      conditionLabel: 'Mới 90% (Rất mới)',
      category: 'sach_truyen',
      ageRange: '0-12 tháng',
      locationName: 'P. Hòa Hải (KĐT FPT City), Q. Ngũ Hành Sơn, Đà Nẵng',
      wardId: 'nhs_hoahai',
      districtId: 'dn_nguhanhson',
      coordinates: { latitude: 15.9782, longitude: 108.2618 },
      image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80',
      description: 'Sách vải có tiếng sột soạt vui tai, đuôi thú nổi 3D giúp bé luyện cầm nắm, gặm nướu an toàn 100%, giặt máy thoải mái.',
      sellerId: meDauDau._id,
      sellerName: meDauDau.name,
      sellerAvatar: meDauDau.avatar,
      sellerPhone: meDauDau.phone,
      safeFeeLocked: 1,
      status: 'available',
    },
    {
      name: 'Ghế ăn dặm Hanbei gấp gọn có bánh xe & khay ăn kép',
      price: 15,
      condition: '90',
      conditionLabel: 'Mới 90% (Rất mới)',
      category: 'xe_noi',
      ageRange: '0-12 tháng',
      locationName: 'P. Hòa Thuận Đông, Q. Hải Châu, Đà Nẵng',
      wardId: 'hc_hoathuan',
      districtId: 'dn_haichau',
      coordinates: { latitude: 16.0558, longitude: 108.2182 },
      image: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=800&auto=format&fit=crop&q=80',
      description: 'Ghế ăn dặm Hanbei điều chỉnh 3 độ cao, có đệm da PU chống thấm nước, đai an toàn 5 điểm chắc chắn.',
      sellerId: meHoaLan._id,
      sellerName: meHoaLan.name,
      sellerAvatar: meHoaLan.avatar,
      sellerPhone: meHoaLan.phone,
      safeFeeLocked: 2,
      status: 'available',
    },
    {
      name: 'Bộ xếp hình Lego Duplo 65 chi tiết chính hãng Đan Mạch',
      price: 10,
      condition: '90',
      conditionLabel: 'Mới 90% (Rất mới)',
      category: 'toy_large',
      ageRange: '1-3 tuổi',
      locationName: 'P. Phước Mỹ, Q. Sơn Trà, Đà Nẵng',
      wardId: 'st_phuocmy',
      districtId: 'dn_sontra',
      coordinates: { latitude: 16.0628, longitude: 108.2442 },
      image: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800&auto=format&fit=crop&q=80',
      description: 'Gạch Lego Duplo kích thước lớn chống hóc cho bé từ 18 tháng. Đủ 65 mảnh ghép kèm thùng nhựa đựng chính hãng.',
      sellerId: meNgocAnh._id,
      sellerName: meNgocAnh.name,
      sellerAvatar: meNgocAnh.avatar,
      sellerPhone: meNgocAnh.phone,
      safeFeeLocked: 1,
      status: 'available',
    },
    {
      name: '[Tặng 0 Xu] Combo 4 bình sữa Pigeon & Túi trữ sữa Sunmum',
      price: 0,
      condition: '90',
      conditionLabel: 'Mới 90% (Rất mới)',
      category: 'charity',
      ageRange: '0-12 tháng',
      locationName: 'Trạm Tặng Đồ Hải Châu, 112 Nguyễn Văn Linh, Đà Nẵng',
      wardId: 'hc_thachthang',
      districtId: 'dn_haichau',
      coordinates: { latitude: 16.0605, longitude: 108.2155 },
      image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800&auto=format&fit=crop&q=80',
      description: 'Mình mua dư hộp túi trữ sữa nguyên seal và 4 bình sữa đã tiệt trùng kỹ. Gửi tặng 0 Xu cho mẹ nào sắp sinh bé nhé!',
      sellerId: meHoaLan._id,
      sellerName: meHoaLan.name,
      sellerAvatar: meHoaLan.avatar,
      sellerPhone: meHoaLan.phone,
      safeFeeLocked: 0,
      status: 'available',
    },
    {
      name: '[Tặng 0 Xu] Bộ thẻ học thông minh Glenn Doman 100 chủ đề',
      price: 0,
      condition: '80',
      conditionLabel: 'Mới 80% (Khá mới)',
      category: 'tu_thien',
      ageRange: '1-3 tuổi',
      locationName: 'Trạm Tặng Đồ FPT Plaza 2, Q. Ngũ Hành Sơn, Đà Nẵng',
      wardId: 'nhs_hoahai',
      districtId: 'dn_nguhanhson',
      coordinates: { latitude: 15.9795, longitude: 108.2602 },
      image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&auto=format&fit=crop&q=80',
      description: 'Bộ Flashcard giấy Ivory cứng cáp chống lóa mắt cho bé tập nói. Tặng miễn phí 0 Xu tại sảnh FPT Plaza 2.',
      sellerId: meDauDau._id,
      sellerName: meDauDau.name,
      sellerAvatar: meDauDau.avatar,
      sellerPhone: meDauDau.phone,
      safeFeeLocked: 0,
      status: 'available',
    },
  ]);

  console.log(`✅ Created ${products.length} products with high-res images & Da Nang coordinates`);

  // ---- Create Demo Transactions ----
  const demoTxCompleted = await Transaction.create({
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
    handoverCode: 'KDR888',
    finalizedAt: new Date(Date.now() - 86400000 * 1.5),
    qrCodePayload: `KINDR|TX:DEMO1|${products[1]._id}`,
    buyerRated: true,
    sellerRated: true,
  });

  // ---- Create Ratings ----
  await Rating.insertMany([
    {
      transactionId: demoTxCompleted._id,
      fromUserId: meHoaLan._id,
      fromUserName: meHoaLan.name,
      toUserId: meBap._id,
      toUserName: meBap.name,
      stars: 5,
      comment: 'Đồ của Mẹ Bắp thơm tho, mới tinh đúng như mô tả. Giao hàng rất đúng hẹn!',
      tags: ['Đúng hẹn, thân thiện', 'Đồ sạch đẹp đúng mô tả'],
    },
    {
      transactionId: demoTxCompleted._id,
      fromUserId: meBap._id,
      fromUserName: meBap.name,
      toUserId: meHoaLan._id,
      toUserName: meHoaLan.name,
      stars: 5,
      comment: 'Mẹ Hoa Lan rất lịch sự, xác nhận mã PIN nhanh gọn. Cảm ơn mẹ nhiều!',
      tags: ['Mẹ bỉm văn minh Đà Nẵng', 'Giao dịch nhanh gọn'],
    },
  ]);

  // ---- Create Demo Chat ----
  const demoChat = await Chat.create({
    productId: products[1]._id,
    productName: products[1].name,
    productImage: products[1].image,
    buyerId: meHoaLan._id,
    buyerName: meHoaLan.name,
    sellerId: meBap._id,
    sellerName: meBap.name,
    lastMessageText: 'Giao dịch đã hoàn tất tốt đẹp! Cảm ơn mẹ nhé!',
    lastMessageTime: new Date(Date.now() - 3600000 * 12),
  });

  await Message.insertMany([
    { chatId: demoChat._id, senderId: meHoaLan._id, senderName: meHoaLan.name, content: 'Chào mẹ Bắp, bộ body Nous này còn mới không ạ?', createdAt: new Date(Date.now() - 3600000 * 15) },
    { chatId: demoChat._id, senderId: meBap._id, senderName: meBap.name, content: 'Dạ còn mới 90% luôn mẹ ơi, bé nhà mình trộm vía tăng cân nhanh nên mặc chật.', createdAt: new Date(Date.now() - 3600000 * 14) },
    { chatId: demoChat._id, senderId: meHoaLan._id, senderName: meHoaLan.name, content: 'Vậy mình bấm Ký quỹ đổi đồ rồi chiều 17h30 hẹn ở sảnh nhận đồ và đọc mã PIN nhé!', createdAt: new Date(Date.now() - 3600000 * 13) },
    { chatId: demoChat._id, senderId: meBap._id, senderName: meBap.name, content: 'Ok mẹ nè, hẹn gặp mẹ chiều nay nha!', createdAt: new Date(Date.now() - 3600000 * 12.5) },
    { chatId: demoChat._id, senderId: meHoaLan._id, senderName: meHoaLan.name, content: 'Giao dịch đã hoàn tất tốt đẹp! Cảm ơn mẹ nhé!', createdAt: new Date(Date.now() - 3600000 * 12) },
  ]);

  // ---- Create Notifications ----
  await Notification.insertMany([
    {
      userId: meHoaLan._id,
      type: 'welcome_credit',
      title: 'Chào mừng Mẹ Hoa Lan đến với Kindr!',
      body: 'Ví của mẹ đã sẵn sàng với 45 Xu khả dụng và 98/100 Điểm Văn Minh.',
      createdAt: new Date(Date.now() - 86400000),
    },
    {
      userId: meHoaLan._id,
      type: 'xu_released',
      title: 'Giao dịch Bảo Chứng Kép hoàn tất!',
      body: `Đổi đồ "${products[1].name}" thành công. Mẹ được cộng +1 Điểm Văn Minh!`,
      relatedTransactionId: demoTxCompleted._id,
      createdAt: new Date(Date.now() - 3600000 * 2),
    },
  ]);

  console.log('🎉 Database seeded successfully!');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((error) => {
  console.error('Seed error:', error);
  process.exit(1);
});
