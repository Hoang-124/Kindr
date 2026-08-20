// src/utils/pricing.ts
import { CategoryType, ConditionType } from '../types/common';

export type { CategoryType, ConditionType };

/**
 * Tỷ giá quy đổi chuẩn của Kindr
 * 1 Xu = 10.000 VNĐ
 */
export const XU_TO_VND_RATE = 10000;

/**
 * Khung định giá cố định chuẩn hóa (Price Anchoring System)
 * Dựa trên Danh mục và Độ mới (70% - 80% - 90%)
 */
export const PRICING_MATRIX: Record<string, Record<string, number>> = {
  // Sách / Truyện tranh: Mới 70% (1 Xu ~ 10k), Mới 80% (1 Xu ~ 10k), Mới 90% (2 Xu ~ 20k)
  book: { '90': 2, '80': 1, '70': 1, 'new': 2, 'like_new': 2, 'good': 1, 'fair': 1 },
  sach_truyen: { '90': 2, '80': 1, '70': 1, 'new': 2, 'like_new': 2, 'good': 1, 'fair': 1 },

  // Đồ chơi nhỏ (Búp bê, xe mô hình, flashcard): 70% (2 Xu), 80% (3 Xu), 90% (4 Xu)
  toy_small: { '90': 4, '80': 3, '70': 2, 'new': 4, 'like_new': 3, 'good': 2, 'fair': 2 },
  do_choi: { '90': 4, '80': 3, '70': 2, 'new': 4, 'like_new': 3, 'good': 2, 'fair': 2 },

  // Đồ chơi lớn (Lego, xe chòi chân, bảng vẽ): 70% (5 Xu), 80% (8 Xu), 90% (10 Xu)
  toy_large: { '90': 10, '80': 8, '70': 5, 'new': 10, 'like_new': 8, 'good': 5, 'fair': 5 },
  xe_noi: { '90': 30, '80': 20, '70': 15, 'new': 30, 'like_new': 25, 'good': 20, 'fair': 15 },

  // Quần áo bé sơ sinh & trẻ nhỏ: 70% (2 Xu), 80% (3 Xu), 90% (5 Xu)
  quan_ao: { '90': 5, '80': 3, '70': 2, 'new': 5, 'like_new': 4, 'good': 3, 'fair': 2 },

  // Đồ học tập: 70% (2 Xu), 80% (3 Xu), 90% (4 Xu)
  do_hoc_tap: { '90': 4, '80': 3, '70': 2, 'new': 4, 'like_new': 3, 'good': 2, 'fair': 2 },

  // Trạm tặng đồ 0 Xu
  charity: { '90': 0, '80': 0, '70': 0, 'new': 0, 'like_new': 0, 'good': 0, 'fair': 0 },
  tu_thien: { '90': 0, '80': 0, '70': 0, 'new': 0, 'like_new': 0, 'good': 0, 'fair': 0 },
};

/**
 * Trả về số Xu gợi ý chuẩn xác theo danh mục và độ mới
 */
export function getSuggestedXu(category: CategoryType, condition: ConditionType): number {
  if (category === 'charity' || category === 'tu_thien') return 0;
  return PRICING_MATRIX[category]?.[condition] ?? 3;
}

/**
 * Tính Phí Cam Kết 10% (Safe Fee) của Người bán khi đăng bài
 * Mức cọc tối thiểu là 1 Xu (đối với đồ có phí)
 */
export function calculateSafeFee(priceInXu: number): number {
  if (priceInXu <= 0) return 0;
  return Math.max(1, Math.round(priceInXu * 0.1));
}

/**
 * Trả về nhãn độ mới tiếng Việt chuẩn
 */
export function getConditionLabel(condition: ConditionType): string {
  switch (condition) {
    case '90':
    case 'new':
      return 'Mới 90% (Rất mới, không trầy xước)';
    case '80':
    case 'like_new':
    case 'good':
      return 'Mới 80% (Khá mới, dùng tốt)';
    case '70':
    case 'fair':
      return 'Mới 70% (Đã dùng nhiều, còn nguyên vẹn)';
    default:
      return 'Mới 80%';
  }
}

/**
 * Trả về nhãn danh mục tiếng Việt kèm icon
 */
export function getCategoryLabel(category: CategoryType): string {
  switch (category) {
    case 'toy_small':
    case 'do_choi':
      return 'Đồ chơi nhỏ 🧸';
    case 'toy_large':
      return 'Đồ chơi lớn 🚲';
    case 'xe_noi':
      return 'Xe đẩy & Nôi cũi 🚼';
    case 'book':
    case 'sach_truyen':
      return 'Sách truyện 📚';
    case 'quan_ao':
      return 'Quần áo bé 👶';
    case 'do_hoc_tap':
      return 'Đồ học tập ✏️';
    case 'charity':
    case 'tu_thien':
      return 'Trạm Tặng Đồ 🎁 (0 Xu)';
    default:
      return 'Khác';
  }
}

/**
 * Tạo câu nhắc Nudge gợi ý giá thông minh cho người bán
 */
export function getSmartPricingNudge(category: CategoryType, condition: ConditionType): string {
  const suggested = getSuggestedXu(category, condition);
  if (suggested === 0) {
    return 'Món đồ này sẽ được đăng tại Trạm Tặng Đồ với 0 Xu dành tặng các bé có hoàn cảnh khó khăn ❤️';
  }
  return `Mẹo từ Kindr: Các mẹ khác thường sẵn sàng đổi món đồ này với giá ${suggested} Xu (~${(suggested * 10).toLocaleString('vi-VN')}k). Đặt giá này giúp mẹ tăng 85% cơ hội đổi đồ thành công trong vòng 24 giờ!`;
}
