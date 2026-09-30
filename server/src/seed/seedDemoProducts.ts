// server/src/seed/seedDemoProducts.ts
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from '../config/db';
import { User } from '../models/User';
import { Product } from '../models/Product';

export async function ensureDemoProducts(): Promise<void> {
  await connectDB();
  const availableCount = await Product.countDocuments({ status: 'available' });
  if (availableCount >= 6) {
    console.log(`✅ Already have ${availableCount} available products in feed.`);
    return;
  }

  console.log(`🌱 Seeding fresh available demo products for MVP testing...`);

  // Ensure seller demo users exist
  let sellerMeBap = await User.findOne({ phone: '0905234567' });
  if (!sellerMeBap) {
    const passwordHash = await bcrypt.hash('123456', 10);
    sellerMeBap = await User.create({
      name: 'Mẹ Bắp',
      phone: '0905234567',
      email: 'mebap@kindr.vn',
      passwordHash,
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
      location: { districtId: 'dn_thanhkhe', districtName: 'Quận Thanh Khê', addressDetail: '45 Lê Duẩn, Thanh Khê' },
      xuBalance: 50,
      civilizationPoints: 98,
      tradesCount: 15,
      reputationScore: 4.9,
      ratingCount: 15,
      role: 'user',
      isActivated: true,
    });
  }

  let sellerMeHoaLan = await User.findOne({ phone: '0905123456' });
  if (!sellerMeHoaLan) {
    const passwordHash = await bcrypt.hash('123456', 10);
    sellerMeHoaLan = await User.create({
      name: 'Mẹ Hoa Lan',
      phone: '0905123456',
      email: 'hoalan@kindr.vn',
      passwordHash,
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      location: { districtId: 'dn_haichau', districtName: 'Quận Hải Châu', addressDetail: '123 Trần Phú, Hải Châu' },
      xuBalance: 40,
      civilizationPoints: 99,
      tradesCount: 22,
      reputationScore: 5.0,
      ratingCount: 22,
      role: 'user',
      isActivated: true,
    });
  }

  const items = [
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
      image: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=600',
      description: 'Bộ luồn hạt gỗ tự nhiên sơn an toàn không mùi, các hạt gỗ nhẵn bóng không có dằm. Bé nhà mình chơi qua giai đoạn 1-2 tuổi giờ để lại cho mẹ khác cần.',
      sellerId: sellerMeHoaLan._id,
      sellerName: sellerMeHoaLan.name,
      sellerAvatar: sellerMeHoaLan.avatar,
      sellerPhone: sellerMeHoaLan.phone,
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
      image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600',
      description: 'Set body Nous vải sợi tre siêu thoáng mát, thấm hút mồ hôi. Bé trộm vía tăng cân nhanh nên chỉ mặc đúng 2 tuần là chật, đồ còn như mới 95%.',
      sellerId: sellerMeBap._id,
      sellerName: sellerMeBap.name,
      sellerAvatar: sellerMeBap.avatar,
      sellerPhone: sellerMeBap.phone,
      safeFeeLocked: 1,
      status: 'available',
    },
    {
      name: 'Xe chòi chân hình chú Khủng Long có nhạc và đèn vui nhộn',
      price: 8,
      condition: '80',
      conditionLabel: 'Mới 80% (Khá mới)',
      category: 'xe_noi',
      ageRange: '1-3y',
      locationName: 'P. Hòa Cường Bắc, Q. Hải Châu, Đà Nẵng',
      wardId: 'hc_hoacuongbac',
      districtId: 'dn_haichau',
      image: 'https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?w=600',
      description: 'Xe chòi chân nhựa đúc nguyên khối chịu lực 30kg, bánh xe chống trượt êm ái. Nhạc và đèn LED hoạt động hoàn hảo, tặng kèm pin mới.',
      sellerId: sellerMeHoaLan._id,
      sellerName: sellerMeHoaLan.name,
      sellerAvatar: sellerMeHoaLan.avatar,
      sellerPhone: sellerMeHoaLan.phone,
      safeFeeLocked: 1,
      status: 'available',
    },
    {
      name: 'Bộ sách vải Lalala Baby 6 cuốn kích thích đa giác quan',
      price: 3,
      condition: '90',
      conditionLabel: 'Mới 90% (Rất mới)',
      category: 'sach_truyen',
      ageRange: '0-6m',
      locationName: 'P. An Hải Bắc, Q. Sơn Trà, Đà Nẵng',
      wardId: 'st_anhaibac',
      districtId: 'dn_sontra',
      image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600',
      description: 'Sách vải có sột soạt, đuôi thú nổi 3D, bé gặm an toàn không độc hại. Đã giặt sạch tiệt trùng thơm tho.',
      sellerId: sellerMeBap._id,
      sellerName: sellerMeBap.name,
      sellerAvatar: sellerMeBap.avatar,
      sellerPhone: sellerMeBap.phone,
      safeFeeLocked: 1,
      status: 'available',
    },
    {
      name: 'Ngựa bập bênh 3 in 1 Holla kiêm xe chòi chân và bàn ăn',
      price: 12,
      condition: '80',
      conditionLabel: 'Mới 80% (Khá mới)',
      category: 'do_choi',
      ageRange: '1-3y',
      locationName: 'P. Hòa Thuận Tây, Q. Hải Châu, Đà Nẵng',
      wardId: 'hc_hoathuantay',
      districtId: 'dn_haichau',
      image: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=600',
      description: 'Ngựa bập bênh Holla có đai bảo vệ an toàn cho bé từ 10 tháng đến 3 tuổi. Bánh xe trượt mượt mà có nhạc, đế bập bênh vững chãi.',
      sellerId: sellerMeHoaLan._id,
      sellerName: sellerMeHoaLan.name,
      sellerAvatar: sellerMeHoaLan.avatar,
      sellerPhone: sellerMeHoaLan.phone,
      safeFeeLocked: 2,
      status: 'available',
    },
    {
      name: 'Ghế ăn dặm Hanbei gập gọn có bánh xe đa năng nâng hạ',
      price: 15,
      condition: '90',
      conditionLabel: 'Mới 90% (Rất mới)',
      category: 'do_dung',
      ageRange: '6-12m',
      locationName: 'P. Vĩnh Trung, Q. Thanh Khê, Đà Nẵng',
      wardId: 'tk_vinhtrung',
      districtId: 'dn_thanhkhe',
      image: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=600',
      description: 'Ghế Hanbei chính hãng khay ăn kép tháo rời vệ sinh dễ dàng. Có đệm lót da PU êm ái chống thấm nước.',
      sellerId: sellerMeBap._id,
      sellerName: sellerMeBap.name,
      sellerAvatar: sellerMeBap.avatar,
      sellerPhone: sellerMeBap.phone,
      safeFeeLocked: 2,
      status: 'available',
    }
  ];

  await Product.insertMany(items);
  console.log(`✅ Successfully seeded ${items.length} available products!`);
}

if (require.main === module) {
  ensureDemoProducts()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
