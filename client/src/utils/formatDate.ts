// src/utils/formatDate.ts

/**
 * Convert Date or date string to relative "Time Ago" string in Vietnamese
 */
export const timeAgo = (dateInput: Date | string | number): string => {
  const date = new Date(dateInput);
  const now = new Date();
  const secondsPast = (now.getTime() - date.getTime()) / 1000;

  if (secondsPast < 0) {
    return 'Vừa xong';
  }
  if (secondsPast < 60) {
    return `${Math.floor(secondsPast)} giây trước`;
  }
  if (secondsPast < 3600) {
    return `${Math.floor(secondsPast / 60)} phút trước`;
  }
  if (secondsPast < 86400) {
    return `${Math.floor(secondsPast / 3600)} giờ trước`;
  }
  if (secondsPast < 2592000) {
    return `${Math.floor(secondsPast / 86400)} ngày trước`;
  }
  if (secondsPast < 31536000) {
    return `${Math.floor(secondsPast / 2592000)} tháng trước`;
  }
  return `${Math.floor(secondsPast / 31536000)} năm trước`;
};

/**
 * Format full date to DD/MM/YYYY HH:MM
 */
export const formatFullDate = (dateInput: Date | string | number): string => {
  const d = new Date(dateInput);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};
