# 🏗️ KINDR BACKEND SPECIFICATION (BACKEND_SPEC.md)

> **Đây là tài liệu bắt buộc đọc trước khi viết bất kỳ code backend nào.**
> File này mô tả toàn bộ API contract, database schema, Socket.IO events, và business rules.

---

## 🗂️ Cấu Trúc Dự Án

```
d:\Kindr\
├── src/                          # React Native Frontend (Expo SDK 56)
├── server/                       # Node.js Backend
│   ├── src/
│   │   ├── config/               # ✅ DONE: db.ts, env.ts
│   │   ├── models/               # ✅ DONE: All 10 Mongoose models (User, Product, Transaction, Chat, Notification, Wallet, Rating, Report, Waitlist, Category)
│   │   ├── middleware/            # ✅ DONE: auth.ts (JWT + admin guard)
│   │   ├── routes/               # ✅ COMPLETE: All routes implemented & mounted
│   │   │   ├── auth.ts           # ✅ COMPLETE (register, login, refresh, me, logout, delete account)
│   │   │   ├── products.ts       # ✅ COMPLETE (GET list/my/:id, POST, PUT, DELETE, ai-suggest)
│   │   │   ├── transactions.ts   # ✅ COMPLETE (Escrow, Handover 6h, Complete, Dispute)
│   │   │   ├── chat.ts           # ✅ COMPLETE (List chats, Paginated messages, Create chat)
│   │   │   ├── notifications.ts  # ✅ COMPLETE (List, Mark read, Mark all, Unread count)
│   │   │   ├── wallet.ts         # ✅ COMPLETE (Balance, Topup VietQR, Withdraw 10%, History)
│   │   │   ├── ratings.ts        # ✅ COMPLETE (Rate 5-star, Civilization Points, User ratings)
│   │   │   ├── reports.ts        # ✅ COMPLETE (File report, My reports)
│   │   │   ├── admin.ts          # ✅ COMPLETE (Dashboard, Users lock/unlock, Dispute resolve, Withdraw approve)
│   │   │   ├── categories.ts     # ✅ COMPLETE (Dynamic categories CRUD + seed)
│   │   │   ├── waitlist.ts       # ✅ COMPLETE (Public registration, admin entries listing)
│   │   │   └── care-handbook.ts  # ✅ COMPLETE (CRUD vaccine, growth, reviews)
│   │   ├── services/             # 🟡 PARTIAL: escrowService.ts ✅ (full logic)
│   │   ├── socket/               # ✅ DONE: index.ts, chatHandler.ts, notificationHandler.ts
│   │   ├── seed/                 # ✅ DONE: seed.ts
│   │   └── app.ts                # ✅ DONE (mount thêm routes mới vào đây)
│   ├── .env                      # ✅ DONE
│   ├── package.json              # ✅ DONE
│   └── tsconfig.json             # ✅ DONE
```

---

## 📌 QUY TẮC BẮT BUỘC KHI VIẾT CODE BACKEND

### 1. Pattern Chuẩn Mực (Xem file mẫu)
- **Route mẫu:** [`server/src/routes/auth.ts`](file:///d:/Kindr/server/src/routes/auth.ts) và [`server/src/routes/products.ts`](file:///d:/Kindr/server/src/routes/products.ts)
- **Mọi route mới PHẢI follow đúng pattern:**
  - Import `Router, Response` từ express
  - Import `z` từ zod cho validation
  - Import `requireAuth, optionalAuth, AuthRequest` từ middleware
  - Dùng `Zod schema` validate request body
  - Try-catch mỗi handler, trả `{ error: 'message' }` khi lỗi
  - Trả status code chuẩn: 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Server Error

### 2. Khi Tạo Route Mới
1. Tạo file trong `server/src/routes/`
2. **BẮT BUỘC** mount route trong [`server/src/app.ts`](file:///d:/Kindr/server/src/app.ts) (uncomment TODO line tương ứng)
3. Export `default router`

### 3. Business Rules Quan Trọng
- **1 Xu = 10.000 VNĐ** (không bao giờ thay đổi)
- **SafeFee = 10%** giá sản phẩm (tối thiểu 1 Xu, charity = 0)
- **Welcome Credit = 10 Xu** (Non-withdrawable — Xu tặng chào mừng)
- **5 Xu Tiên Phong (Founding Member):** 200 suất đầu tiên trong waitlist (`orderNumber <= 200`, `foundingMember: true`). Khi đăng ký tài khoản (thường, kích hoạt email hoặc Google), hệ thống tự động claim atomic (`xuClaimed: true`, `claimedByUserId: user._id`). Người dùng được cộng `+5` vào `xuBalance` và `+5` vào `welcomeCreditRemaining` (Xu tặng không rút được). Mỗi entry waitlist chỉ được claim 1 lần duy nhất.
- **Phí rút tiền = 10%** trên tổng Xu rút
- **6h Safeful Time** sau khi xác nhận nhận hàng
- **3 strikes → auto lock** tài khoản
- **Contact masking:** SĐT ẩn trên product listing, mở khóa trong transaction

---

## 📡 API ENDPOINTS — Chi Tiết Cần Tạo

### `routes/transactions.ts` ✅ COMPLETE (Escrow, Handover PIN/QR, Complete, Dispute)

> **Business logic đã hoàn tất và tối ưu trong [`server/src/services/escrowService.ts`](file:///d:/Kindr/server/src/services/escrowService.ts)**.
- Tạo giao dịch Escrow trừ tiền nguyên tử CAS (Atomic CAS).
- Phân biệt Xu thật và Welcome Credit (`buyerPromoXu`).
- Mã PIN 6 ký tự ngẫu nhiên bảo mật (loại trừ ký tự dễ nhầm O/0/I/1).
- Người mua giữ mã PIN/QR. Người bán nhập mã PIN khi giao đồ (tối đa 5 lần thử sai).
- Người mua có thể tự xác nhận đã nhận đồ P2P không cần PIN.

| Method | Endpoint | Auth | Handler |
|:---|:---|:---|:---|
| POST | `/api/transactions` | Required | Tạo Escrow, khóa Xu người mua + 10% Safe Fee người bán |
| GET | `/api/transactions/my` | Required | Danh sách giao dịch người dùng tham gia |
| GET | `/api/transactions/:id` | Required | Chi tiết giao dịch, unmask SĐT/Zalo; chỉ trả handoverCode/QR cho người mua |
| POST | `/api/transactions/:id/handover` | Required | Xác nhận bàn giao: Người bán cần `handoverCode`, người mua tự xác nhận |
| POST | `/api/transactions/:id/complete` | Required | Người mua xác nhận sớm hài lòng 100%, giải phóng Xu ngay |
| POST | `/api/transactions/:id/dispute` | Required | Mở khiếu nại chất lượng trong 6h Safeful Time |

---

### `routes/wallet.ts` ✅ COMPLETE (Balance, Topup VietQR / PayOS, Webhook, Withdraw CAS, History)

- **Cổng thanh toán PayOS (VietQR Chuẩn):** Tỷ giá nạp `1 Xu = 1.000 VNĐ`, miễn phí nạp (0đ).
- **Thư viện tích hợp:** `@payos/node` (Client ID, API Key, Checksum Key).
- Webhook PayOS xác thực chữ ký tự động (`payos.verifyPaymentWebhookData`), cơ chế **Idempotent** chống cộng tiền trùng lặp, cập nhật nguyên tử số dư `xuBalance` và ghi nhận lịch sử vào `PaymentOrder`.
- Bắn sự kiện thời gian thực qua Socket.IO (`wallet:topup_success`, `topup_success`) và Expo Push Notification.
- Gated demo topup bằng `ENABLE_DEMO_TOPUP` (403 trong production).
- Rút Xu bảo vệ bằng Atomic CAS chống double-spending (`User.findOneAndUpdate({ _id, xuBalance: { $gte: amount } })`).

| Method | Endpoint | Auth | Mô tả |
|:---|:---|:---|:---|
| GET | `/api/wallet/balance` | Required | Trả `{ xuBalance, xuFrozen, welcomeCreditRemaining }` |
| POST | `/api/wallet/topup/create-link` | Required | Tạo link thanh toán PayOS VietQR nạp Xu (1 Xu = 1.000 VNĐ, tối thiểu 10 Xu) |
| POST | `/api/wallet/topup/payos-webhook` | Public | Webhook callback từ PayOS, xác thực chữ ký & cộng Xu Idempotent |
| GET | `/api/wallet/topup/status/:orderCode` | Required | Kiểm tra trạng thái đơn nạp & tự động sync từ PayOS |
| POST | `/api/wallet/topup/cancel/:orderCode` | Required | Hủy đơn nạp PENDING & hủy trên PayOS |
| POST | `/api/wallet/topup/simulate-success/:orderCode` | Dev/Demo Only | Giả lập nạp tiền thành công phục vụ demo không cần chuyển khoản thật |
| POST | `/api/wallet/create-order` | Required | Tạo đơn nạp tiền VietQR thủ công kèm mã chuyển khoản duy nhất |
| POST | `/api/wallet/webhook` | Webhook Secret | Đối soát tự động ngân hàng thủ công |
| POST | `/api/wallet/topup` | Demo Only | Giả lập nạp tiền trực tiếp |
| POST | `/api/wallet/withdraw` | Required | Đặt lệnh rút tiền Atomic CAS, thu phí 10% |
| GET | `/api/wallet/history` | Required | Lịch sử giao dịch ví, lệnh rút và danh sách đơn PayOS |

---

### Hướng Dẫn Cấu Hình Cổng Thanh Toán PayOS (VietQR)
1. **Lấy API Key trên PayOS Dashboard:**
   - Truy cập [https://payos.vn/](https://payos.vn/) và đăng ký/đăng nhập tài khoản.
   - Tạo kênh thanh toán và lấy bộ ba khóa: `Client ID`, `API Key`, `Checksum Key`.
2. **Cấu hình biến môi trường (`server/.env`):**
   ```env
   PAYOS_CLIENT_ID=your_client_id_here
   PAYOS_API_KEY=your_api_key_here
   PAYOS_CHECKSUM_KEY=your_checksum_key_here
   PAYOS_RETURN_URL=http://localhost:8081
   PAYOS_CANCEL_URL=http://localhost:8081
   ```
3. **Cấu hình Webhook URL:**
   - Khi chạy production/ngrok: Trỏ Webhook URL trên PayOS Dashboard về `https://your-domain.com/api/wallet/topup/payos-webhook`.
   - Khi chạy localhost / không có public IP: Hệ thống tự động có cơ chế Polling 3s (`GET /api/wallet/topup/status/:orderCode`) tra cứu trực tiếp từ PayOS và nút **"Giả lập thanh toán test"** (`POST /api/wallet/topup/simulate-success/:orderCode`) giúp kiểm thử luồng cộng Xu tức thì.

---

### `routes/chat.ts` ✅ COMPLETE

> **Real-time đã được xử lý bởi Socket.IO** trong [`server/src/socket/chatHandler.ts`](file:///d:/Kindr/server/src/socket/chatHandler.ts). REST route dùng cho lịch sử tin nhắn.

| Method | Endpoint | Auth | Mô tả |
|:---|:---|:---|:---|
| GET | `/api/chats` | Required | Lấy danh sách chats của người dùng |
| GET | `/api/chats/:id/messages` | Required | Lấy tin nhắn theo chatId phân trang |
| POST | `/api/chats` | Required | Tạo hoặc lấy hội thoại chat giữa người mua và người bán |

---

### `routes/notifications.ts` ✅ COMPLETE

| Method | Endpoint | Auth | Mô tả |
|:---|:---|:---|:---|
| GET | `/api/notifications` | Required | Lấy thông báo cá nhân phân trang |
| PUT | `/api/notifications/:id/read` | Required | Đánh dấu thông báo đã đọc |
| PUT | `/api/notifications/read-all` | Required | Đánh dấu tất cả thông báo đã đọc |
| GET | `/api/notifications/unread-count` | Required | Đếm số thông báo chưa đọc |

---

### `routes/ratings.ts` ✅ COMPLETE (Atomic CAS, Civilization Points, No Duplicate)

- Đánh giá giao dịch Atomic CAS trên `buyerRated` / `sellerRated`.
- Điểm văn minh cộng/trừ được clamp an toàn trong biên độ 0 - 100.
- Compound unique index `{ transactionId: 1, fromUserId: 1 }`.

| Method | Endpoint | Auth | Mô tả |
|:---|:---|:---|:---|
| POST | `/api/ratings` | Required | Gửi đánh giá sao, comment, tags cho đối tác giao dịch |
| GET | `/api/ratings/user/:userId` | Optional | Lấy danh sách đánh giá công khai của người dùng |

---

### `routes/reports.ts` ✅ COMPLETE

| Method | Endpoint | Auth | Mô tả |
|:---|:---|:---|:---|
| POST | `/api/reports` | Required | Báo cáo tài khoản hoặc giao dịch vi phạm |
| GET | `/api/reports/my` | Required | Xem danh sách báo cáo đã gửi |

---

### `routes/admin.ts` ✅ COMPLETE

> Yêu cầu `requireAuth` + `requireAdmin`.

| Method | Endpoint | Mô tả |
|:---|:---|:---|
| GET | `/api/admin/dashboard` | Thống kê tổng quan hệ thống Kindr |
| GET | `/api/admin/users` | Quản lý danh sách người dùng |
| PUT | `/api/admin/users/:id/lock` | Khóa tài khoản và hủy toàn bộ refresh tokens |
| PUT | `/api/admin/users/:id/unlock` | Mở khóa tài khoản |
| GET | `/api/admin/products` | Danh sách sản phẩm |
| DELETE | `/api/admin/products/:id` | Xóa sản phẩm vi phạm |
| GET | `/api/admin/transactions` | Danh sách toàn bộ giao dịch Escrow |
| GET | `/api/admin/disputes` | Danh sách khiếu nại đang chờ xử lý |
| PUT | `/api/admin/disputes/:id/resolve` | Phán quyết khiếu nại (hoàn Xu người mua hoặc giải ngân người bán) |
| GET | `/api/admin/withdraws` | Danh sách yêu cầu rút tiền |
| PUT | `/api/admin/withdraws/:id/approve` | Duyệt chi trả rút tiền |
| PUT | `/api/admin/withdraws/:id/reject` | Từ chối rút tiền và hoàn Xu lại vào ví người dùng (Atomic CAS) |
| GET | `/api/admin/reports` | Quản lý báo cáo người dùng |
| PUT | `/api/admin/reports/:id` | Cập nhật trạng thái xử lý báo cáo |

---

### `routes/care-handbook.ts` ⏳ CHƯA IMPLEMENT (Planned for Phase 2)

> ⚠️ **Lưu ý:** Module Sổ tay Chăm sóc bé (`care-handbook.ts`) **chưa được implement** trên backend trong giai đoạn MVP hiện tại. Các tính năng tiêm chủng, tăng trưởng và đánh giá địa điểm sẽ được bổ sung ở Phase tiếp theo.

| Method | Endpoint | Auth | Mô tả | Trạng thái |
|:---|:---|:---|:---|:---|
| GET/POST | `/api/care/vaccines` | Required | CRUD lịch tiêm chủng của bé | ⏳ Chưa có backend route |
| GET/POST | `/api/care/growth` | Required | CRUD theo dõi chiều cao, cân nặng | ⏳ Chưa có backend route |
| GET/POST | `/api/care/reviews` | Required | CRUD đánh giá địa điểm mẹ & bé | ⏳ Chưa có backend route |

---

## 📜 CÁC QUY TẮC NGHIỆP VỤ & BẢO MẬT MỚI (PHASE 1 - 7)

### 1. Luật Bàn Giao PIN & QR
- **Người mua nắm giữ bí mật:** Khi giao dịch chuyển sang `awaiting_handover`, hệ thống tự sinh mã PIN 6 ký tự ngẫu nhiên bằng `crypto.randomInt` từ tập ký tự không gây nhầm lẫn: `ABCDEFGHJKMNPQRSTUVWXYZ23456789`.
- **Ẩn mã khỏi Người bán:** Trường `handoverCode` và `qrCodePayload` chỉ được trả về cho Người mua (hoặc Admin). Người bán hoàn toàn không thể xem mã này từ API hay notification.
- **Xác thực lúc gặp mặt:**
  - **Người bán:** Phải nhập chính xác mã PIN 6 ký tự do Người mua cung cấp trên app. Cho phép tối đa **5 lần nhập sai**. Quá 5 lần, phương thức nhập mã bị khóa cứng (`handoverFailedAttempts >= 5`).
  - **Người mua:** Có toàn quyền tự bấm *"Tôi đã nhận hàng"* trên thiết bị của mình mà **không cần nhập mã** (vì đây là số tiền của chính họ đang được bảo chứng).
- Sau khi bàn giao thành công, đồng hồ **6 Giờ Kiểm Định Tại Nhà (Safeful Time)** bắt đầu đếm ngược.

### 2. Luật Xu Tặng (Welcome Credit) & Phòng Chống Rửa Tiền
- **Bản chất Welcome Credit (`welcomeCreditRemaining`):** Là phần số dư "Non-withdrawable" (không thể rút thành tiền mặt). Khi đăng ký mới, người dùng nhận 10 Xu khuyến mãi.
- **Luật tiêu dùng:** Xu tặng luôn được ưu tiên khấu trừ trước khi người mua thanh toán tiền hàng hoặc người bán ký quỹ SafeFee 10%:
  $$\text{promoUsed} = \min(\text{welcomeCreditRemaining}, \text{price})$$
- **Truy vết giao dịch:** `buyerPromoXu` được lưu vào bản ghi `Transaction`.
- **Bảo lưu tính chất không rút được qua vòng trao đổi:** Khi giải ngân tiền hàng cho người bán (`finalizeTransaction` hoặc giải quyết tranh chấp người bán thắng), số lượng `buyerPromoXu` được cộng vào `welcomeCreditRemaining` của người bán. Nhờ đó, người bán nhận được Xu để tiếp tục đổi đồ trên nền tảng nhưng **không thể rút ra tiền mặt**, triệt tiêu hoàn toàn lỗ hổng rửa tiền tạo nick mới để rút Xu khuyến mại.
- **Rút tiền an toàn (Atomic CAS):**
  Lệnh rút tiền chỉ cho phép rút tối đa số Xu nạp thực tế:
  $$\text{xuWithdrawable} = \text{xuBalance} - \text{welcomeCreditRemaining} \ge \text{xuAmount}$$

### 3. Biến Môi Trường Hệ Thống (ENV Specs)
| Biến | Mặc định | Bắt buộc trong Prod | Mô tả |
|:---|:---|:---:|:---|
| `MONGO_URI` | `mongodb://localhost:27017/kindr` | Có | Chuỗi kết nối MongoDB standalone / replica set |
| `JWT_SECRET` | - | Có (>= 32 ký tự) | Khóa ký Access Token (ném lỗi nếu dùng mặc định) |
| `JWT_REFRESH_SECRET` | - | Có (>= 32 ký tự) | Khóa ký Refresh Token |
| `WEBHOOK_SECRET` | - | Có | Khóa đối soát bảo vệ endpoint `/api/wallet/webhook` |
| `BANK_CODE` | `MB` | Có | Mã ngân hàng nhận tiền nạp VietQR |
| `BANK_NAME` | `MBBank` | Có | Tên ngân hàng nhận chuyển khoản |
| `BANK_ACCOUNT_NUMBER`| - | Có | Số tài khoản nhận tiền (bắt buộc để tạo đơn) |
| `BANK_ACCOUNT_HOLDER`| - | Có | Tên chủ tài khoản nhận tiền nạp |
| `ENABLE_DEMO_TOPUP` | `false` | Tắt (`false`) | Cho phép endpoint nạp xu trực tiếp không qua ngân hàng |
| `ENABLE_DEMO_LOGIN` | `false` | Tắt (`false`) | Cho phép đăng nhập nhanh qua tài khoản demo (trả 404 nếu tắt) |

---

## 🔌 SOCKET.IO EVENTS — Đã Implement

### Connection
```javascript
// Client kết nối:
const socket = io('http://localhost:5000', {
  auth: { token: accessToken }
});
```

### Chat Events (✅ DONE)
| Direction | Event | Data |
|:---|:---|:---|
| Client → Server | `join_chat` | `{ chatId }` |
| Client → Server | `send_message` | `{ chatId, content }` |
| Client → Server | `typing` | `{ chatId }` |
| Client → Server | `stop_typing` | `{ chatId }` |
| Client → Server | `leave_chat` | `{ chatId }` |
| Server → Client | `message_received` | `{ chatId, message: { _id, senderId, senderName, content, createdAt } }` |
| Server → Client | `chat_updated` | `{ chatId, lastMessageText, lastMessageTime, unreadCount }` |
| Server → Client | `user_typing` | `{ chatId, userId }` |
| Server → Client | `user_stop_typing` | `{ chatId, userId }` |

### Notification Events (✅ DONE)
| Direction | Event | Data |
|:---|:---|:---|
| Server → Client | `notification_new` | Full notification object |
| Client → Server | `mark_notification_read` | `{ notificationId }` |
| Client → Server | `mark_all_notifications_read` | (no data) |

---

## 🗄️ MONGOOSE MODELS — Tất Cả Đã Tạo

| Model | File | Key Fields |
|:---|:---|:---|
| User | `models/User.ts` | name, phone, passwordHash, xuBalance, xuFrozen, civilizationPoints, role |
| Product | `models/Product.ts` | name, price, condition, category, sellerId, safeFeeLocked, status |
| Transaction | `models/Transaction.ts` | buyerId, sellerId, buyerEscrowFrozen, sellerEscrowFrozen, status, safefulTimeExpiresAt |
| Chat | `models/Chat.ts` | buyerId, sellerId, productId, buyerUnreadCount, sellerUnreadCount |
| Message | `models/Message.ts` | chatId, senderId, content |
| Notification | `models/Notification.ts` | userId, type, title, body, isRead |
| Rating | `models/Rating.ts` | transactionId, fromUserId, toUserId, stars, comment |
| WithdrawRequest | `models/WithdrawRequest.ts` | userId, xuAmount, feeVnd, payoutVnd, status |
| Report | `models/Report.ts` | targetType, targetId, reporterId, reason, status |

---

## ⚡ HƯỚNG DẪN NHANH CHO DEVELOPER

### Chạy server:
```bash
cd server
npm install
npm run dev        # Dev server with hot reload
npm run seed       # Seed demo data
```

### Tạo route mới (ví dụ `routes/wallet.ts`):
1. Copy pattern từ `routes/products.ts`
2. Thay đổi model, validation schema, logic
3. Mount trong `app.ts`: `app.use('/api/wallet', walletRoutes);`
4. Test bằng curl hoặc Postman

### Khi cần gửi notification real-time:
```typescript
import { emitToUser } from '../socket';
import { Notification } from '../models/Notification';

const notif = await Notification.create({
  userId: targetUserId,
  type: 'xu_released',
  title: 'Xu đã vào ví! 🟡',
  body: 'Chi tiết...',
});
emitToUser(targetUserId, 'notification_new', notif);
```

---

## 🔗 KẾT NỐI FRONTEND (Phase tiếp theo)

Frontend cần tạo:
1. `src/services/api.ts` — Axios instance với JWT interceptor
2. `src/services/socketService.ts` — Socket.IO client singleton
3. Refactor Redux slices để dùng `createAsyncThunk` gọi API thay vì hardcode data
4. Flag `USE_MOCK_DATA` để toggle giữa mock/API (giữ app demo offline được)

---

> **⚠️ QUAN TRỌNG:** Khi implement route mới, LUÔN đọc lại các file mẫu đã tạo để follow đúng pattern. Không được tự sáng tạo cấu trúc mới.
