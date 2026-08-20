# BÁO CÁO THIẾT KẾ GIAO DIỆN & TRẢI NGHIỆM NGƯỜI DÙNG
## DỰ ÁN KINDR (WIREFRAME & UI MOCKUP)

Dự án **Kindr** là nền tảng di động hỗ trợ các bậc cha mẹ trao đổi đồ dùng cũ của trẻ em bằng hệ thống Xu ảo. Dưới đây là mô tả chi tiết về cấu trúc Wireframe, giao diện UI Mockup và trải nghiệm tương tác trực quan của sản phẩm.

---

## 1. Nguyên tắc thiết kế Giao diện (Design Principles)
* **Tone màu chủ đạo**: Sử dụng các tone màu dịu nhẹ mang cảm giác ấm áp và tin cậy như màu xanh lá pastel (Primary Green - tượng trưng cho sự văn minh, thân thiện) phối hợp với các màu nền kem sáng và màu cam đất (Tertiary - tượng trưng cho năng lượng, trẻ thơ).
* **Typography**: Sử dụng font chữ hiện đại (như Arial hoặc Inter), kích thước to rõ ràng, bo tròn các góc khung (Radius lớn) để mang lại cảm giác an toàn và dễ gần.
* **Linh vật (Mascot)**: Hình ảnh chú gấu **Kindr Buddy** xuất hiện xuyên suốt các điểm chạm giao diện để hướng dẫn và tạo niềm vui cho người dùng.

---

## 2. Chi tiết cấu trúc Wireframe & UI Mockup từng màn hình

### A. Luồng Chào mừng & Đăng nhập (Auth & Onboarding Flow)
* **Màn hình Splash (Chào mừng)**:
  * **Wireframe**: Logo thương hiệu nằm ở chính giữa, phía dưới là hình ảnh Mascot chú gấu lớn, chân trang có thanh tiến trình chạy từ 0% đến 100% để chuyển cảnh.
  * **Trải nghiệm**: Tạo ấn tượng đầu tiên nhẹ nhàng, vui tươi với hiệu ứng fade-in.
* **Màn hình Onboarding (Giới thiệu tính năng)**:
  * **Wireframe**: Gồm 3 slide ngang độc lập. Mỗi slide chiếm 60% diện tích là ảnh minh họa lớn bo tròn dạng bong bóng, phía dưới là tiêu đề lớn và 2-3 dòng mô tả ngắn. Dưới cùng có dấu chấm tròn chỉ vị trí slide và nút lệnh điều hướng.
  * **Nội dung**: Giới thiệu hệ thống giao dịch bằng Xu, cơ chế bảo chứng an toàn và lối sống dọn nhà ngăn nắp.
* **Màn hình Đăng nhập (Login)**:
  * **Wireframe**: Form nhập thông tin số điện thoại/email truyền thống nằm ở giữa.
  * **Bảng chọn tài khoản Demo nhanh (Quick Login Panel)**: Thiết kế đặc thù hiển thị danh sách các thẻ tài khoản mẫu (Mẹ Hoa Lan, Mẹ Bắp, Mẹ Ngọc Ánh) kèm ảnh đại diện tròn và số dư Xu hiện tại để người dùng có thể nhấp chọn và đăng nhập nhanh không cần mật khẩu khi kiểm thử.

### B. Màn hình chính Trang chủ (HomeScreen Feed)
* **Thanh Header trên cùng**: Tên người dùng chào cá nhân hóa bên trái; bên phải là nút hiển thị số Xu màu cam đất nổi bật nổi bật (`X 25 Xu`) để người dùng luôn kiểm soát được số dư của mình.
* **Thanh tìm kiếm (Search Bar)**: Đặt ngay dưới header, có dạng hình hộp chữ nhật bo góc tròn hoàn toàn (Capsule) với gợi ý *"Mẹ muốn tìm món gì cho bé?"*.
* **Banner hành động (Declutter Banner)**: Khung màu xanh nhạt chứa thông điệp *"Hôm nay dọn nhà cho bé đỡ chật nhé mẹ ơi!"*, đi kèm hình Mascot và nút **"Đăng đồ ngay"** màu xanh đậm.
* **Danh mục Bento Grid**: 6 biểu tượng danh mục trực quan được xếp thành grid 3x2 (Đồ chơi, Sách truyện, Đồ học tập, Quần áo bé, Xe & Nôi cũi, Trạm Tặng Đồ). Mỗi danh mục có màu nền vòng tròn pastel và biểu tượng nét mảnh đặc trưng.
* **Luồng sản phẩm gần bạn (Gần mẹ hôm nay)**: Grid hiển thị sản phẩm chia làm 2 cột. Mỗi thẻ sản phẩm là một khối bo góc nhẹ, chứa:
  * Ảnh sản phẩm vuông chiếm 50% diện tích thẻ.
  * Huy hiệu khoảng cách và khu vực (VD: *1.2 km • Hải Châu*) nổi trên ảnh.
  * Tiêu đề sản phẩm (2 dòng), tên & avatar thu nhỏ của người đăng bán.
  * Giá quy đổi bằng Xu nổi bật góc dưới bên phải.

### C. Chi tiết sản phẩm & Giao tiếp (Product Detail & Chat)
* **Màn hình chi tiết sản phẩm**:
  * Ảnh sản phẩm lớn tràn viền trên cùng, tích hợp nút quay lại và nút yêu thích (trái tim).
  * Khung thông tin dưới chứa tên sản phẩm, thẻ phân loại, độ tuổi phù hợp.
  * Bảng giá Xu nổi bật kèm đánh giá tình trạng đồ cũ (VD: *Khá tốt 70-90%*).
  * Khung thông tin người bán hiển thị số giao dịch đã thực hiện để tăng độ uy tín.
  * 2 nút chính ở chân trang: **"Chat với người bán"** (nhỏ) và **"Đổi đồ ngay"** (lớn, màu thương hiệu).
* **Màn hình Trò chuyện (ChatDetail)**:
  * Header hiển thị tên đối tác và thẻ tóm tắt sản phẩm đang trao đổi.
  * Luồng tin nhắn bong bóng trực quan (tin nhắn gửi đi màu xanh lá, tin nhắn nhận về màu xám nhạt).
  * Tích hợp các phím tắt nhanh ở trên bàn phím: gửi vị trí, đề xuất đổi đồ.

---

## 3. Luồng Giao dịch & Quản lý Tài chính (Escrow & Wallet Flow)
* **Giao dịch bảo chứng (Escrow System)**:
  * Màn hình thể hiện dòng trạng thái giao dịch rõ ràng: *Đang đóng băng Xu* -> *Đang giao hàng* -> *Hoàn thành / Khiếu nại*.
  * Tích hợp mã QR nhận đồ độc bản. Khi hai bên gặp nhau, người bán quét mã QR này của người mua để hệ thống tự động giải phóng số Xu đang tạm khóa, đảm bảo an toàn tuyệt đối.
* **Quản lý Ví (Wallet)**:
  * Giao diện ví đơn giản hiển thị số dư Xu lớn ở trung tâm.
  * Có biểu mẫu Nạp Xu (Top Up) giả lập liên kết ngân hàng và Rút Xu (Withdraw) gửi yêu cầu duyệt admin.
  * Lịch sử giao dịch chi tiết phân loại rõ ràng dòng Xu cộng (+) và dòng Xu trừ (-).
