// src/config/appConfig.ts
export const APP_CONFIG = {
  appName: 'Kindr',
  tagline: 'Đổi đồ cũ, nhận niềm vui mới cho bé',
  version: '1.0.0-MVP',
  
  // Tokenomics (Hệ thống Xu)
  token: {
    symbol: 'Xu',
    name: 'Vui Xu',
    rateVND: 10000, // 1 Xu = 10,000 VNĐ
    withdrawalFeePercent: 10, // Phí dịch vụ rút tiền 10%
    startingBalance: 15, // Tặng 15 Xu khi đăng ký mới
  },
  
  // Double Escrow Rules (Ký quỹ song phương)
  escrow: {
    civilizationDeposit: 2, // Phí bảo chứng 2 Xu mỗi bên để đảm bảo uy tín
    verificationHoursLimit: 24, // Thời gian kiểm tra hàng 24 giờ sau khi quét QR
  },
  
  // Pilot Area (Khu vực thí điểm Đà Nẵng)
  pilotCity: 'Đà Nẵng',
  districts: [
    { id: 'hc', name: 'Quận Hải Châu' },
    { id: 'tk', name: 'Quận Thanh Khê' },
    { id: 'st', name: 'Quận Sơn Trà' },
    { id: 'nhs', name: 'Quận Ngũ Hành Sơn' },
    { id: 'lc', name: 'Quận Liên Chiểu' },
    { id: 'cl', name: 'Quận Cẩm Lệ' },
    { id: 'hv', name: 'Huyện Hòa Vang' },
  ],
  
  // Categories (Danh mục Bento)
  categories: [
    { id: 'do_choi', name: 'Đồ chơi', icon: 'ToyBrick', color: '#615e54' },
    { id: 'sach_truyen', name: 'Sách truyện', icon: 'BookOpen', color: '#7b5455' },
    { id: 'do_hoc_tap', name: 'Đồ học tập', icon: 'GraduationCap', color: '#3a6758' },
    { id: 'quan_ao', name: 'Quần áo bé', icon: 'Shirt', color: '#615e54' },
    { id: 'xe_noi', name: 'Xe & Nôi cũi', icon: 'Baby', color: '#7b5455' },
    { id: 'tu_thien', name: 'Trạm Tặng Đồ', icon: 'Gift', color: '#3a6758' }
  ]
};
