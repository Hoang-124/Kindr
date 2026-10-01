# Hướng Dẫn Triển Khai (Deploy) Landing Page & Backend Kindr

> **Mô hình kiến trúc:**
> - **Frontend (Landing Page):** Triển khai lên **Vercel** (Global Edge CDN, tự động có chứng chỉ bảo mật HTTPS, hỗ trợ tên miền riêng miễn phí).
> - **Backend (API Waitlist & Gửi Mail):** Triển khai lên **Render.com** (Node.js Express + TypeScript).
> - **Database:** **MongoDB Atlas** (Cụm Cloud M0 miễn phí trọn đời).

---

## BƯỚC 1: Chuẩn Bị MongoDB Cloud (MongoDB Atlas) - Miễn Phí

1. Truy cập [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) và đăng ký/đăng nhập tài khoản.
2. Bấm **Create a Deployment** $\rightarrow$ Chọn gói **M0 (Free)** $\rightarrow$ Chọn khu vực gần Việt Nam nhất (Singapore `ap-southeast-1`).
3. **Security Quickstart:**
   - **Username & Password:** Tạo tài khoản quản trị DB (ví dụ: `kindr_admin` và mật khẩu mạnh). Lưu lại mật khẩu này.
   - **IP Access List:** Chọn **Allow Access from Anywhere** (`0.0.0.0/0`) để Render có thể kết nối được.
4. Bấm **Connect** $\rightarrow$ Chọn **Drivers (Node.js)** $\rightarrow$ Sao chép chuỗi kết nối (Connection String):
   ```text
   mongodb+srv://kindr_admin:<password>@cluster0.xxxxx.mongodb.net/kindr?retryWrites=true&w=majority
   ```
   *(Thay `<password>` bằng mật khẩu bạn vừa tạo).*

---

## BƯỚC 2: Deploy Backend Lên Render.com

1. Truy cập [render.com](https://render.com) và đăng nhập bằng tài khoản GitHub của bạn.
2. Bấm **New +** $\rightarrow$ Chọn **Web Service** $\rightarrow$ Chọn repository **Kindr**.
3. Cấu hình các thông số:
   - **Name:** `kindr-backend` (hoặc tên bạn muốn)
   - **Region:** Singapore (Southeast Asia)
   - **Root Directory:** `server`
   - **Runtime:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start`
   - **Instance Type:** `Free`
4. Cuộn xuống phần **Environment Variables** (Biến môi trường) và thêm các biến sau:
   | Key | Value | Ghi chú |
   | :--- | :--- | :--- |
   | `NODE_ENV` | `production` | Chế độ production |
   | `PORT` | `5000` | Cổng dịch vụ |
   | `MONGO_URI` | *[Chuỗi kết nối Atlas ở Bước 1]* | URL database |
   | `JWT_SECRET` | `kindr_prod_jwt_secret_2026_super_secure` | Khóa bí mật JWT |
   | `JWT_REFRESH_SECRET` | `kindr_prod_refresh_secret_2026` | Khóa refresh |
   | `SMTP_HOST` | `smtp.gmail.com` | Máy chủ mail Google |
   | `SMTP_PORT` | `465` | Cổng SSL |
   | `SMTP_USER` | `ht20041975@gmail.com` | Email gửi thư |
   | `SMTP_PASS` | `rdgsrjdfadbfugqx` | Google App Password |
   | `EMAIL_FROM` | `Kindr Ecosystem <ht20041975@gmail.com>` | Tên người gửi |

5. Bấm **Create Web Service**.
   - Render sẽ tự động build TypeScript và chạy server.
   - Khi hoàn tất, Render sẽ cấp cho bạn một đường dẫn công khai, ví dụ: **`https://kindr-backend.onrender.com`**.
   - Bạn có thể kiểm tra sức khỏe API bằng cách mở: `https://kindr-backend.onrender.com/api/health` (trả về `{"status":"ok"}`).

---

## BƯỚC 3: Deploy Landing Page Lên Vercel

Hệ thống đã chuẩn bị sẵn file cấu hình [`vercel.json`](file:///d:/Kindr/vercel.json) ở thư mục gốc của dự án.

### Cách 1: Qua giao diện Vercel Dashboard (Khuyên dùng)
1. Đẩy code lên GitHub repository của bạn.
2. Truy cập [vercel.com](https://vercel.com) $\rightarrow$ Đăng nhập $\rightarrow$ Bấm **Add New...** $\rightarrow$ **Project**.
3. Chọn repository **Kindr** $\rightarrow$ Bấm **Import**.
4. **Cấu hình Project Settings:**
   - **Framework Preset:** `Other` (hoặc để mặc định).
   - **Root Directory:** Giữ nguyên `./` (Vercel sẽ tự động đọc file [`vercel.json`](file:///d:/Kindr/vercel.json) để điều hướng các trang trong `pitch-page`).
5. Thêm biến môi trường (Environment Variable) nếu muốn ghi đè URL Backend:
   - Hoặc đơn giản là mở [`pitch-page/index.html`](file:///d:/Kindr/pitch-page/index.html), trong thẻ `<head>` thêm 1 dòng:
     ```html
     <script>window.KINDR_API_URL = "https://kindr-backend.onrender.com";</script>
     ```
6. Bấm **Deploy**.
   - Chỉ mất khoảng 10 - 20 giây, trang web của bạn sẽ online với tên miền dạng `https://kindr-xxx.vercel.app`.

### Cách 2: Triển khai nhanh bằng Vercel CLI từ máy tính
Mở PowerShell tại thư mục dự án và chạy:
```powershell
npx vercel
```
Làm theo hướng dẫn đăng nhập và chọn thiết lập mặc định. Khi muốn đưa lên môi trường chính thức:
```powershell
npx vercel --prod
```

---

## BƯỚC 4: Gắn Tên Miền Riêng (Custom Domain - ví dụ `kindr.vn`)

1. Trên Vercel Dashboard, vào dự án của bạn $\rightarrow$ **Settings** $\rightarrow$ **Domains**.
2. Nhập tên miền của bạn (ví dụ: `kindr.vn` hoặc `landing.kindr.vn`) $\rightarrow$ Bấm **Add**.
3. Vercel sẽ cung cấp bản ghi DNS cần cấu hình (Bản ghi `A` trỏ về IP của Vercel hoặc `CNAME` trỏ về `cname.vercel-dns.com`).
4. Truy cập trang quản lý tên miền của bạn (như PA Việt Nam, Mắt Bão, Cloudflare, Namecheap...) và thêm bản ghi tương ứng.
5. Vercel sẽ tự động xác thực và kích hoạt chứng chỉ SSL HTTPS miễn phí chỉ sau vài phút.
