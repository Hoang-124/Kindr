# Hướng dẫn Cài đặt Môi trường, Khởi chạy & Xuất bản Ứng dụng Kindr

Tài liệu này hướng dẫn chi tiết toàn bộ các bước từ thiết lập môi trường, cài đặt dự án, chạy thử cho đến đóng gói phát hành ứng dụng **Kindr** lên Google Play Store (Android) và Apple App Store (iOS).

---

## 1. Cài đặt Môi trường & Khởi chạy Dự án (Dành cho Developer / Tester)

### Bước A: Cài đặt công cụ nền tảng (Prerequisites)
1. **Cài đặt Node.js**: 
   Tải và cài đặt Node.js phiên bản LTS (khuyên dùng v18 hoặc v20+) từ trang chủ [nodejs.org](https://nodejs.org/). Cài đặt Node.js sẽ tự động đi kèm công cụ quản lý gói `npm`.
2. **Cài đặt Git**:
   Tải và cài đặt Git từ [git-scm.com](https://git-scm.com/) để tải và quản lý mã nguồn dự án.

### Bước B: Tải mã nguồn & Cài đặt thư viện (Setup dependencies)
1. **Di chuyển vào thư mục dự án**:
   Mở ứng dụng Command Prompt / PowerShell (Windows) hoặc Terminal (macOS/Linux), di chuyển đến thư mục của dự án:
   ```bash
   cd Kindr
   ```
2. **Cài đặt thư viện**:
   Chạy lệnh cài đặt toàn bộ gói phụ thuộc cần thiết được khai báo trong dự án:
   ```bash
   npm install
   ```

### Bước C: Khởi động ứng dụng (Start Project)

Có hai phương pháp chạy ứng dụng để kiểm thử:

#### Phương pháp 1: Khởi chạy trên Web Browser (Nhanh và Tiện lợi)
Chạy lệnh biên dịch và giả lập trực tiếp trên giao diện trình duyệt Web:
```bash
npm run web
```
*Hệ thống sẽ chạy máy chủ Expo Web và tự động mở địa chỉ trang web kiểm thử tại: `http://localhost:8081`.*

#### Phương pháp 2: Chạy trực tiếp trên Điện thoại thật (Qua ứng dụng Expo Go)
1. Tải ứng dụng **Expo Go** từ App Store (iOS) hoặc Google Play Store (Android) về điện thoại của bạn.
2. Chạy lệnh khởi tạo máy chủ Metro trên máy tính:
   ```bash
   npm start
   ```
3. Sau khi chạy, một **mã QR** lớn sẽ hiển thị trên màn hình Terminal của máy tính.
   - **Android**: Mở ứng dụng **Expo Go**, nhấn chọn **"Scan QR Code"** và hướng camera quét mã QR.
   - **iOS (iPhone)**: Mở ứng dụng **Camera hệ thống**, quét mã QR rồi nhấn chấp nhận mở bằng **Expo Go**.
   *(Lưu ý quan trọng: Máy tính chạy lệnh và điện thoại quét QR phải kết nối chung một mạng Wi-Fi).*

---

## 2. Chuẩn bị tài khoản nhà phát triển để xuất bản (Developer Account)

Để đưa ứng dụng lên các chợ chính thức, bạn bắt buộc phải đăng ký tài khoản nhà phát triển:
* **Google Play Console (Android):** Phí đăng ký một lần **$25 USD**. Đăng ký tại [Play Console](https://play.google.com/console).
* **Apple Developer Program (iOS):** Phí duy trì hàng năm **$99 USD/năm**. Đăng ký tại [Apple Developer](https://developer.apple.com/programs/).

---

## 3. Cài đặt EAS CLI & Đăng nhập

Dịch vụ **EAS Build** chạy trên máy chủ đám mây của Expo, giúp đóng gói APK/AAB (Android) và IPA (iOS) mà không yêu cầu cấu hình phần cứng nặng nề (như Mac cho iOS).

1. Cài đặt công cụ EAS CLI toàn cục:
   ```bash
   npm install -g eas-cli
   ```

2. Đăng nhập hoặc tạo tài khoản Expo:
   ```bash
   eas login
   ```

3. Khởi tạo cấu hình EAS cho dự án (chạy tại thư mục gốc dự án):
   ```bash
   eas project:init
   ```

---

## 4. Cấu hình file `eas.json` và `app.json`

### Bước A: Cấu hình thông tin ứng dụng trong `app.json`
Mở `app.json` và cấu hình các trường định danh duy nhất:
```json
{
  "expo": {
    "name": "Kindr",
    "slug": "kindr-app",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.kindr.app",
      "supportsTablet": true
    },
    "android": {
      "package": "com.kindr.app",
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#fff8f4"
      }
    }
  }
}
```

### Bước B: Tạo file cấu hình đóng gói `eas.json`
Tạo file `eas.json` tại thư mục gốc của dự án để cấu hình các môi trường build:
```json
{
  "cli": {
    "version": ">= 10.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  },
  "submit": {
    "production": {}
  }
}
```

---

## 5. Thực hiện Build Đóng gói (EAS Build)

Chạy các lệnh đóng gói trên đám mây của Expo:

### A. Đóng gói cho Android:
Build file `.aab` (Android App Bundle - định dạng tải lên Google Play):
```bash
eas build --platform android --profile production
```
*Lưu ý:* Nếu bạn muốn tạo file cài đặt trực tiếp `.apk` để kiểm thử nội bộ, hãy sửa đổi profile preview trong `eas.json` để có `"buildType": "apk"` và chạy:
```bash
eas build --platform android --profile preview
```

### B. Đóng gói cho iOS:
Build file `.ipa` (định dạng tải lên Apple App Store):
```bash
eas build --platform ios --profile production
```
*Lưu ý:* Khi chạy lệnh này, EAS sẽ yêu cầu bạn đăng nhập tài khoản Apple Developer để tự động tạo các chứng chỉ ký số (App Signing Credentials).

---

## 6. Đưa ứng dụng lên Store (EAS Submit)

Sau khi EAS Build hoàn thành, Expo sẽ trả về một liên kết tải xuống file cài đặt. Bạn có thể tự động đẩy file này lên chợ ứng dụng thông qua lệnh:

```bash
# Gửi phiên bản Android mới nhất lên Google Play
eas submit --platform android

# Gửi phiên bản iOS mới nhất lên Apple App Store TestFlight
eas submit --platform ios
```

### Kiểm duyệt Store (Store Review Tips)
1. **Google Play:** Cần tối thiểu 20 người dùng thử nghiệm (Testers) chạy thử ứng dụng liên tục trong 14 ngày trước khi được cấp quyền phát hành công khai lên Production (chính sách mới từ năm 2023).
2. **Apple App Store:** Đảm bảo cung cấp một tài khoản test hoạt động đầy đủ trong phần mô tả duyệt app để kiểm duyệt viên của Apple có thể đăng nhập trải nghiệm trực tiếp.
