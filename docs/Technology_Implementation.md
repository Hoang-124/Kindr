# BÁO CÁO ĐỊNH HƯỚNG CÔNG NGHỆ & KIẾN TRÚC HỆ THỐNG
## DỰ ÁN KINDR (TECHNOLOGY & IMPLEMENTATION)

Dự án **Kindr** áp dụng các công nghệ hiện đại nhằm giải quyết bài toán giao dịch trao đổi hàng hóa ngang hàng (P2P) kết hợp bảo chứng ví điện tử giả lập. Dưới đây là phân tích chi tiết về định hướng công nghệ, cấu trúc mã nguồn (Tech Stack) và kiến trúc hệ thống tổng thể.

---

## 1. Định hướng Công nghệ của Sản phẩm/Dịch vụ
Dự án được thiết kế theo các định hướng chiến lược sau:
* **Đa nền tảng (Cross-platform)**: Hỗ trợ triển khai nhanh chóng trên cả thiết bị di động (Android, iOS) và máy tính thông qua trình duyệt Web với một cơ sở mã duy nhất (Single Codebase).
* **Tối ưu trải nghiệm ngoại tuyến (Offline-first & Persistence)**: Ứng dụng hoạt động mượt mà nhờ việc lưu trữ trạng thái cục bộ trên thiết bị, cho phép hiển thị dữ liệu ngay lập tức khi khởi động mà không cần chờ đợi mạng.
* **Kiến trúc hướng Module (Feature-based Architecture)**: Chia nhỏ hệ thống thành các khối độc lập theo tính năng nghiệp vụ, giúp nhiều nhà phát triển có thể làm việc song song mà không gây xung đột mã nguồn.

---

## 2. Tech Stack dự kiến & Thực tế mã nguồn

### A. Công nghệ cốt lõi (Core Framework)
* **React Native & Expo SDK 56**: Lựa chọn công nghệ này giúp phát triển nhanh, tận dụng được sức mạnh của native component và được hỗ trợ bởi hệ sinh thái Expo mạnh mẽ cho việc build và submit ứng dụng đám mây (thông qua EAS Build).
* **TypeScript**: Ngôn ngữ lập trình chính, giúp quản lý chặt chẽ các kiểu dữ liệu giao dịch, sản phẩm, tin nhắn và thông tin người dùng, giảm thiểu 90% lỗi cú pháp và runtime.

### B. Quản lý trạng thái & Lưu trữ (State & Storage)
* **Redux Toolkit (`@reduxjs/toolkit` & `react-redux`)**: Quản lý toàn bộ luồng dữ liệu của ứng dụng trong một Store thống nhất. Tránh việc truyền props quá sâu (prop-drilling) và giúp quản lý các trạng thái phức tạp như giao dịch đóng băng Xu.
* **AsyncStorage**: Đóng vai trò làm cơ sở dữ liệu tạm thời trên thiết bị. Toàn bộ thay đổi trạng thái của Redux Store sẽ được tự động đồng bộ xuống bộ nhớ thiết bị theo thời gian thực và khôi phục (hydrate) lại khi ứng dụng mở lại.

### C. Giao diện & Trải nghiệm tương tác (UI & Navigation)
* **React Navigation v7**: Sử dụng `Native Stack Navigator` cho các màn hình chi tiết, biểu mẫu và `Bottom Tab Navigator` cho các tab chức năng chính ở chân trang (Trang chủ, Tìm kiếm, Đăng đồ, Tin nhắn, Cá nhân).
* **Lucide React Native**: Cung cấp bộ icon vector nét mảnh chất lượng cao, đồng bộ hóa phong cách giao diện hiện đại.

### D. Tích hợp Trí tuệ nhân tạo (AI Integration)
* **SDK `@google/genai` (Gemini SDK)**: Tích hợp sẵn sàng cho các tính năng tương lai như:
  * Tự động quét hình ảnh sản phẩm để điền thông tin (tên, danh mục, mô tả gợi ý).
  * Trợ lý ảo AI giúp tư vấn giao dịch văn minh hoặc hòa giải tranh chấp tự động giữa các người dùng.

---

## 3. Kiến trúc Hệ thống Tổng quan

### A. Kiến trúc thư mục Code (Directory Structure)
Mã nguồn ứng dụng được phân chia rõ ràng để đảm bảo tính mở rộng cao:
* **`/src/app`**: Điểm bắt đầu của ứng dụng, chứa cấu hình Store Redux (`store/index.ts`, `store/rootReducer.ts`), hệ thống định tuyến dẫn đường (`navigation/AppNavigator.tsx`), và các lớp bọc Provider (`providers/AppProvider.tsx`, `providers/AuthProvider.tsx`).
* **`/src/features`**: Chứa toàn bộ logic nghiệp vụ cốt lõi, được gom cụm theo từng tính năng:
  * `/auth`: Xử lý Splash, Onboarding, Đăng nhập, Đăng ký và quản lý phiên người dùng.
  * `/home`: Xử lý Feed sản phẩm trang chủ, trang chi tiết và tìm kiếm bộ lọc.
  * `/post`: Quản lý việc đăng tin đồ cũ mới, trạm tặng đồ từ thiện và bài đăng cá nhân.
  * `/exchange`: Quản lý logic giao dịch tạm khóa Xu (Escrow), sinh mã QR giao nhận, và tạo đơn khiếu nại tranh chấp (Dispute).
  * `/chat`: Xử lý luồng tin nhắn trao đổi thời gian thực giữa hai mẹ bỉm sữa.
  * `/profile`: Quản lý thông tin cá nhân, ví Xu, nạp tiền và rút tiền.
  * `/admin`: Bảng điều khiển quản trị viên để duyệt rút tiền, giải quyết tranh chấp và kiểm duyệt bài đăng.
* **`/src/components`**: Thư mục chứa các thành phần giao diện tái sử dụng, bao gồm:
  * `common`: Các nút bấm (`Button`), ô nhập liệu (`Input`), hộp thoại cảnh báo (`CustomAlert`), màn hình chờ (`Loading`).
  * `layout`: Khung màn hình (`ScreenContainer`), thanh tiêu đề (`Header`), thẻ hiển thị (`Card`).
  * `form`: Các bộ chọn biểu mẫu biểu thị dữ liệu (`FormSelect`, `FormError`).
* **`/src/theme`**: Chứa hệ thống Design Tokens gồm bảng màu, kiểu chữ, bóng đổ và bo góc.
* **`/src/utils`**: Chứa các hàm tiện ích dùng chung như định dạng tiền tệ Xu, định dạng ngày tháng, và logic tạo chuỗi QR Code.

### B. Cơ chế luồng hoạt động của hệ thống
Hệ thống hoạt động dựa trên cơ chế đồng bộ hóa 3 chiều:
1. **Giao diện người dùng (React Native UI Components)**: Lắng nghe trạng thái từ Redux Store và phản hồi hành động bằng cách dispatch các actions.
2. **Quản lý logic tập trung (Redux Slices)**: Nhận các actions, thay đổi trạng thái trong Store và thông báo cho UI cập nhật giao diện trực quan.
3. **Đồng bộ hóa lưu trữ (Redux Subscription to AsyncStorage)**: Lắng nghe mọi biến động của Store để ghi đè dữ liệu mới nhất xuống bộ nhớ thiết bị. Khi khởi động ứng dụng, bộ giải mã Hydrate trong `AppProvider` sẽ đọc ngược từ AsyncStorage lên Store để phục hồi trạng thái phiên làm việc trước đó của người dùng.
