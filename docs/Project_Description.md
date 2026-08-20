# BÁO CÁO MÔ TẢ DỰ ÁN KINDR

Dự án **Kindr** là một ứng dụng di động đa nền tảng hướng tới mục đích xã hội, giúp các bậc cha mẹ đăng tải đồ dùng cũ của trẻ em (đồ chơi, quần áo, sách truyện, nôi cũi...) để tặng hoặc trao đổi với nhau bằng hệ thống **Xu** (virtual currency) thay vì giao dịch bằng tiền mặt, kết hợp với các cơ chế bảo vệ giao dịch (escrow) và điểm uy tín cộng đồng.

---

## PHẦN I: Wireframe / UI Mockup (Mô tả Sản phẩm Trực quan)

Giao diện của ứng dụng được xây dựng theo phong cách thiết kế hiện đại, ấm áp, nhắm tới đối tượng người dùng chính là các bà mẹ bỉm sữa. Bố cục sử dụng các góc bo tròn lớn, màu sắc pastel nhẹ nhàng và hình ảnh linh vật chú gấu thân thiện (Kindr Buddy).

### 1. Luồng màn hình Chào mừng & Đăng nhập (Auth Flow)
* **Màn hình Splash (SplashScreen)**:
  * Hiển thị logo thương hiệu **Kindr**, linh vật chú gấu cùng khẩu hiệu *"Đổi đồ cũ, nhận niềm vui mới cho bé"*.
  * Tích hợp thanh tiến trình tải dữ liệu (loading bar) động ở cạnh dưới.
* **Màn hình Giới thiệu (OnboardingScreen)**:
  * Gồm 3 slide giới thiệu các tính năng độc đáo của Kindr: Đổi đồ bằng Xu không cần mặc cả, Cơ chế tạm giữ khóa bảo chứng Xu (Escrow), và phong cách sống dọn nhà văn minh gọn gàng.
  * Tích hợp nút **"Bỏ qua"** ở trên và nút **"Tiếp theo / Bắt đầu ngay"** ở dưới.
* **Màn hình Đăng nhập (LoginScreen)**:
  * Chứa form nhập số điện thoại/email và mật khẩu.
  * **Đặc biệt (UI Mockup hỗ trợ Demo):** Có bảng chọn nhanh tài khoản thử nghiệm nhanh (Quick Demo Accounts) hiển thị ảnh đại diện và số dư Xu của các mẹ (Mẹ Hoa Lan, Mẹ Bắp, Mẹ Ngọc Ánh) giúp kiểm thử lập tức không cần đăng ký.

### 2. Màn hình chính & Tìm kiếm (Home & Search Flow)
* **Màn hình chính Trang chủ (HomeScreen)**:
  * **Header**: Hiển thị lời chào cá nhân hóa (VD: *"Chào mẹ, Mẹ Hoa Lan"*) kèm theo huy hiệu số dư ví (ví dụ: `25 Xu`).
  * **Thanh tìm kiếm**: Thiết kế bo tròn tinh tế kích thích mẹ bấm tìm kiếm.
  * **Banner quảng cáo**: Khuyến khích đăng đồ dọn nhà với nút nổi bật **"Đăng đồ ngay"**.
  * **Danh mục nổi bật (Bento Grid)**: Gồm 6 ô chức năng đại diện cho các nhóm mặt hàng (Đồ chơi, Sách truyện, Đồ học tập, Quần áo bé, Xe & Nôi cũi, Trạm Tặng Đồ).
  * **Danh sách sản phẩm (Feed Grid)**: Hiển thị 2 cột, mỗi thẻ sản phẩm chứa: Ảnh sản phẩm, Khoảng cách (VD: *1.2 km*), Tên sản phẩm, Tên & Ảnh đại diện người bán, Giá quy đổi bằng Xu (hoặc 0 Xu đối với mục từ thiện).
* **Màn hình Tìm kiếm & Bộ lọc (SearchScreen)**:
  * Cho phép tìm kiếm bằng từ khóa.
  * Tích hợp **Modal bộ lọc nâng cao** để lọc sản phẩm theo: Danh mục, Quận/Huyện cụ thể (Hải Châu, Thanh Khê...), Tình trạng mới cũ (Mới 100%, >90%, >70%...), và khoảng giá Xu mong muốn.

### 3. Chi tiết Sản phẩm & Giao dịch
* **Chi tiết sản phẩm (ProductDetailScreen)**:
  * Hình ảnh sản phẩm lớn chiếm nửa trên màn hình.
  * Thông tin chi tiết: Giá Xu, độ tuổi thích hợp, tình trạng sử dụng, mô tả dài của sản phẩm.
  * Thẻ người bán hiển thị số lượng giao dịch đã thực hiện và điểm đánh giá sao trung bình.
  * Nút hành động nổi ở cuối: **"Chat với người bán"** và **"Đổi đồ ngay"** (để kích hoạt hợp đồng giao dịch).
* **Quản lý Ví & Giao dịch (WalletScreen & TransactionDetailScreen)**:
  * Hiển thị số dư Xu khả dụng và lịch sử chi tiết.
  * Màn hình nạp Xu (TopUpScreen) và Rút Xu ra tiền mặt (WithdrawScreen).
  * Chi tiết giao dịch thể hiện trạng thái đóng băng Xu an toàn cùng mã QR nhận đồ để người dùng quét xác thực khi gặp nhau trao đổi vật lý.

---

## PHẦN II: Technology & Implementation (Công nghệ & Triển khai)

### 1. Định hướng Công nghệ cho Sản phẩm/Dịch vụ
Dự án được định hướng phát triển theo mô hình **Mobile-First Client-Server Application**, sử dụng cơ chế xử lý dữ liệu đồng bộ thời gian thực cho tính năng nhắn tin và quản lý dòng giao dịch tài chính ảo (Xu) thông qua hợp đồng trung gian (escrow).

### 2. Tech Stack dự kiến (và thực tế trong mã nguồn)
* **Core Framework**: **React Native & Expo SDK 56** (Lập trình ứng dụng di động đa nền tảng chạy đồng thời trên Android, iOS và Web từ một nguồn mã duy nhất).
* **Language**: **TypeScript** (Đảm bảo kiểu dữ liệu an toàn, giảm thiểu lỗi thời gian chạy).
* **State Management**: **Redux Toolkit (`@reduxjs/toolkit`)** (Quản lý trạng thái tập trung toàn cục cho các tính năng: Auth, Home/Products, Exchange/Transactions, và Chat).
* **Local Storage**: **AsyncStorage** (Lưu trữ phiên đăng nhập và trạng thái ngoại tuyến của ứng dụng, hỗ trợ cơ chế khôi phục trạng thái khi khởi động lại).
* **Styling Engine**: **Vanilla StyleSheet & Flexbox** (Thiết kế UI responsive thích ứng tốt với mọi kích thước màn hình điện thoại và trình duyệt).
* **Vector Icons**: **Lucide React Native** (Bộ icon vector hiện đại, sắc nét và nhẹ).
* **Navigation**: **React Navigation v7** (Điều hướng màn hình thông qua Native Stack và Bottom Tab bar mượt mà).
* **AI Integration**: **`@google/genai` (Gemini SDK)** (Sẵn sàng tích hợp trí tuệ nhân tạo hỗ trợ duyệt sản phẩm, tự động phân loại danh mục hoặc trợ lý chat thông minh).

### 3. Kiến trúc Hệ thống Tổng quan
Ứng dụng được cấu trúc hóa theo mô hình kiến trúc **Feature-based Architecture (Kiến trúc theo tính năng)**. Mỗi mô-đun nghiệp vụ sẽ nằm trọn vẹn trong thư mục của nó để dễ dàng mở rộng và bảo trì.

#### Chi tiết Phân rã Thư mục Triển khai:
* **`/src/app`**: Cấu hình cốt lõi gồm định tuyến Navigation, Redux Store và các lớp bọc Provider.
* **`/src/features`**: Chứa toàn bộ logic nghiệp vụ được chia thành các thư mục độc lập (ví dụ: `auth`, `home`, `exchange`, `chat`).
* **`/src/components`**: Chứa các component giao diện dùng chung như các nút bấm, layout màn hình và header.
* **`/src/theme`**: Định nghĩa tập trung các token thiết kế (màu sắc, khoảng cách, bo góc, font chữ).
