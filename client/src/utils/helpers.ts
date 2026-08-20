// src/utils/helpers.ts
import { XU_TO_VND_RATE } from './pricing';

/**
 * Quy đổi Xu sang định dạng VNĐ
 * Ví dụ: 5 Xu -> "50.000 đ"
 */
export const formatXuToVND = (xu: number): string => {
  const vndAmount = (xu || 0) * XU_TO_VND_RATE;
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(vndAmount);
};

/**
 * Định dạng số nguyên có dấu chấm ngăn cách
 * Ví dụ: 150000 -> "150.000"
 */
export const formatNumber = (num: number): string => {
  return (num || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

/**
 * Sinh mã QR Code payload cho giao dịch P2P
 */
export const generateTransactionQRCode = (transactionId: string): string => {
  return `kindr://escrow/verify/${transactionId}`;
};

/**
 * Tạo URL mã QR thanh toán VietQR thật 100%
 * Sử dụng API mở của VietQR (VietinBank / MBBank)
 */
export const getVietQRImageUrl = (
  amountVnd: number,
  memo: string,
  bankId: string = 'ICB', // VietinBank
  accountNo: string = '101876543210'
): string => {
  const encodedMemo = encodeURIComponent(memo);
  const accountName = encodeURIComponent('DU AN KINDR ESCROW FUND');
  return `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${amountVnd}&addInfo=${encodedMemo}&accountName=${accountName}`;
};

/**
 * Định dạng thời gian còn lại của 6 Hours Safeful Time
 * Trả về { hours, minutes, seconds, isExpired, formatted }
 */
export const formatTimeRemaining = (expiresAtISO?: string) => {
  if (!expiresAtISO) {
    return { hours: 0, minutes: 0, seconds: 0, isExpired: true, formatted: '00:00:00', progress: 0 };
  }

  const totalDurationMs = 6 * 3600 * 1000; // 6h = 21,600,000 ms
  const diffMs = new Date(expiresAtISO).getTime() - Date.now();

  if (diffMs <= 0) {
    return { hours: 0, minutes: 0, seconds: 0, isExpired: true, formatted: '00:00:00', progress: 1 };
  }

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

  const formatted = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  const progress = Math.min(1, Math.max(0, 1 - (diffMs / totalDurationMs)));

  return { hours, minutes, seconds, isExpired: false, formatted, progress };
};

/**
 * Ẩn số điện thoại bảo mật danh tính trước giao dịch
 * Ví dụ: 0905123456 -> 0905***456
 */
export const maskPhoneNumber = (phone?: string): string => {
  if (!phone || phone.length < 8) return '0905***456';
  return phone.slice(0, 4) + '***' + phone.slice(-3);
};

/**
 * Validate số điện thoại Việt Nam
 */
export const validatePhone = (phone: string): boolean => {
  const re = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
  return re.test(phone);
};
