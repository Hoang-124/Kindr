// d:\Kindr\web\src\utils\pricing.ts
import { CategoryType, ConditionType } from '../types';

export const XU_TO_VND_RATE = 10000;

export const PRICING_MATRIX: Record<string, Record<ConditionType, number>> = {
  book: { '90': 2, '80': 1, '70': 1 },
  sach_truyen: { '90': 2, '80': 1, '70': 1 },
  toy_small: { '90': 2, '80': 2, '70': 2 },
  do_choi: { '90': 2, '80': 2, '70': 2 },
  toy_large: { '90': 10, '80': 8, '70': 5 },
  xe_noi: { '90': 30, '80': 20, '70': 15 },
  quan_ao: { '90': 5, '80': 3, '70': 2 },
  do_hoc_tap: { '90': 4, '80': 3, '70': 2 },
  charity: { '90': 0, '80': 0, '70': 0 },
  tu_thien: { '90': 0, '80': 0, '70': 0 },
};

export const CATEGORY_OPTIONS: { value: CategoryType; label: string; badge: string }[] = [
  { value: 'toy_small', label: 'Đồ chơi nhỏ', badge: '2 Xu cố định' },
  { value: 'toy_large', label: 'Đồ chơi lớn (Lego, xe chòi...)', badge: '5–10 Xu' },
  { value: 'book', label: 'Sách truyện & Ehon', badge: '1–2 Xu' },
  { value: 'quan_ao', label: 'Quần áo & Phụ kiện bé', badge: '2–5 Xu' },
  { value: 'xe_noi', label: 'Xe đẩy, Nôi cũi & Ghế ăn', badge: '15–30 Xu' },
  { value: 'do_hoc_tap', label: 'Đồ dùng học tập', badge: '2–4 Xu' },
  { value: 'charity', label: 'Trạm Tặng Đồ (0 Xu)', badge: 'Miễn cọc Safe Fee' },
];

export const CONDITION_OPTIONS: { value: ConditionType; label: string; desc: string }[] = [
  { value: '90', label: 'Mới 90%', desc: 'Rất mới, ít dùng, đầy đủ chi tiết' },
  { value: '80', label: 'Mới 80%', desc: 'Khá mới, hoạt động hoàn hảo' },
  { value: '70', label: 'Mới 70%', desc: 'Đã dùng nhiều nhưng còn nguyên vẹn, sạch sẽ' },
];

export function getSuggestedXu(category: string, condition: ConditionType): number {
  if (category === 'charity' || category === 'tu_thien') return 0;
  return PRICING_MATRIX[category]?.[condition] ?? 2;
}

export function getPriceBounds(category: string, condition: ConditionType): {
  min: number;
  max: number;
  suggested: number;
} {
  if (category === 'charity' || category === 'tu_thien') {
    return { min: 0, max: 0, suggested: 0 };
  }
  const suggested = getSuggestedXu(category, condition);
  return {
    min: 1,
    max: suggested,
    suggested,
  };
}

export function calculateSafeFee(priceInXu: number, category?: string): number {
  if (priceInXu <= 0 || category === 'charity' || category === 'tu_thien') return 0;
  return Math.max(1, Math.ceil(priceInXu * 0.1));
}

export function getCategoryLabel(category: string): string {
  const map: Record<string, string> = {
    toy_small: 'Đồ chơi nhỏ',
    do_choi: 'Đồ chơi',
    toy_large: 'Đồ chơi lớn',
    book: 'Sách truyện',
    sach_truyen: 'Sách truyện',
    quan_ao: 'Quần áo bé',
    xe_noi: 'Xe đẩy & Nôi cũi',
    do_hoc_tap: 'Đồ học tập',
    charity: 'Trạm Tặng Đồ 0 Xu',
    tu_thien: 'Trạm Tặng Đồ 0 Xu',
  };
  return map[category] || 'Đồ dùng cho bé';
}

export function getConditionLabel(condition: string): string {
  const map: Record<string, string> = {
    '90': 'Mới 90%',
    '80': 'Mới 80%',
    '70': 'Mới 70%',
  };
  return map[condition] || `Mới ${condition}%`;
}

export function getProductStatusBadge(status?: string): { label: string; className: string } {
  switch (status) {
    case 'available':
      return { label: 'Đang mở đổi', className: 'kw-badge-teal' };
    case 'escrow':
    case 'in_transaction':
      return { label: 'Đang giao dịch Ký quỹ', className: 'kw-badge-gold' };
    case 'swapped':
    case 'completed':
      return { label: 'Đã trao đổi', className: 'kw-badge-secondary' };
    case 'pending_approval':
      return { label: 'Chờ duyệt', className: 'kw-badge-coral' };
    case 'removed':
      return { label: 'Đã gỡ', className: 'kw-badge-danger' };
    default:
      return { label: status || 'Đang mở đổi', className: 'kw-badge-secondary' };
  }
}

export function getTransactionStatusBadge(status?: string): { label: string; className: string } {
  switch (status) {
    case 'awaiting_handover':
      return { label: 'Chờ gặp mặt bàn giao', className: 'kw-badge-gold' };
    case 'in_safeful_time':
      return { label: 'Đang kiểm định 6h', className: 'kw-badge-teal' };
    case 'disputed':
      return { label: 'Đang khiếu nại', className: 'kw-badge-danger' };
    case 'completed':
      return { label: 'Hoàn tất giải ngân', className: 'kw-badge-secondary' };
    case 'refunded':
      return { label: 'Đã hủy / Hoàn Xu', className: 'kw-badge-danger' };
    default:
      return { label: status || 'Đang xử lý', className: 'kw-badge-secondary' };
  }
}

export function getWithdrawStatusBadge(status?: string): { label: string; className: string } {
  switch (status) {
    case 'pending':
      return { label: 'Chờ duyệt chuyển khoản', className: 'kw-badge-gold' };
    case 'approved':
      return { label: 'Đã chuyển khoản', className: 'kw-badge-teal' };
    case 'rejected':
      return { label: 'Từ chối (Đã hoàn Xu)', className: 'kw-badge-danger' };
    default:
      return { label: status || 'Đang xử lý', className: 'kw-badge-secondary' };
  }
}

export function getSmartPricingNudge(category: string, condition: ConditionType): string {
  if (category === 'charity' || category === 'tu_thien') {
    return 'Món đồ tặng 0 Xu tại Trạm Tặng Đồ được miễn 100% cọc Safe Fee và giúp mẹ tăng Điểm Văn Minh!';
  }
  const suggested = getSuggestedXu(category, condition);
  return `Khung giá chuẩn Kindr đề xuất ${suggested} Xu (${formatXuToVND(suggested)}) cho độ mới ${condition}% — giúp bài đăng được đổi nhanh gấp 3 lần trong 24h mà không cần mặc cả.`;
}

export function formatNumber(num: number): string {
  return Math.round(num || 0)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function formatXuToVND(xu: number): string {
  return `${formatNumber((xu || 0) * XU_TO_VND_RATE)}đ`;
}

export function maskPhoneNumber(phone?: string): string {
  if (!phone) return '0905***888';
  return phone.replace(/(\d{4})\d{3}(\d{3})/, '$1***$2');
}

export function formatFullDate(dateInput?: string | Date): string {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function timeAgo(dateInput?: string | Date): string {
  if (!dateInput) return 'Vừa xong';
  const d = new Date(dateInput);
  const diffSec = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
  if (diffSec < 60) return 'Vừa xong';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} giờ trước`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return `${diffDay} ngày trước`;
  return formatFullDate(dateInput);
}

export function formatTimeRemaining(expiresAtISO?: string): {
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  formatted: string;
  progress: number;
} {
  if (!expiresAtISO) {
    return { hours: 6, minutes: 0, seconds: 0, isExpired: false, formatted: '06:00:00', progress: 100 };
  }
  const totalMs = 6 * 3600 * 1000;
  const remainingMs = Math.max(0, new Date(expiresAtISO).getTime() - Date.now());
  const isExpired = remainingMs <= 0;
  const totalSec = Math.floor(remainingMs / 1000);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  const progress = Math.min(100, Math.max(0, (remainingMs / totalMs) * 100));

  return {
    hours,
    minutes,
    seconds,
    isExpired,
    formatted: `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`,
    progress,
  };
}
