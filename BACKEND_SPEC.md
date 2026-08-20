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
│   │   ├── models/               # ✅ DONE: All 8 Mongoose models
│   │   ├── middleware/            # ✅ DONE: auth.ts (JWT + admin guard)
│   │   ├── routes/               # ✅ COMPLETE: All routes implemented & mounted
│   │   │   ├── auth.ts           # ✅ COMPLETE (register, login, refresh, me, logout)
│   │   │   ├── products.ts       # ✅ COMPLETE (GET list/my/:id, POST, PUT, DELETE)
│   │   │   ├── transactions.ts   # ✅ COMPLETE (Escrow, Handover 6h, Complete, Dispute)
│   │   │   ├── chat.ts           # ✅ COMPLETE (List chats, Paginated messages, Create chat)
│   │   │   ├── notifications.ts  # ✅ COMPLETE (List, Mark read, Mark all, Unread count)
│   │   │   ├── wallet.ts         # ✅ COMPLETE (Balance, Topup VietQR, Withdraw 10%, History)
│   │   │   ├── ratings.ts        # ✅ COMPLETE (Rate 5-star, Civilization Points, User ratings)
│   │   │   ├── reports.ts        # ✅ COMPLETE (File report, My reports)
│   │   │   ├── admin.ts          # ✅ COMPLETE (Dashboard, Users lock/unlock, Dispute resolve, Withdraw approve)
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
- **Welcome Credit = 10 Xu** (Non-withdrawable — chưa implement logic phân biệt)
- **Phí rút tiền = 10%** trên tổng Xu rút
- **6h Safeful Time** sau khi xác nhận nhận hàng
- **3 strikes → auto lock** tài khoản
- **Contact masking:** SĐT ẩn trên product listing, mở khóa trong transaction

---

## 📡 API ENDPOINTS — Chi Tiết Cần Tạo

### `routes/transactions.ts` ❌ TODO

> **Business logic đã có sẵn trong [`server/src/services/escrowService.ts`](file:///d:/Kindr/server/src/services/escrowService.ts)**. Route chỉ cần gọi service functions.

| Method | Endpoint | Auth | Handler |
|:---|:---|:---|:---|
| POST | `/api/transactions` | Required | Gọi `escrowService.createEscrow(req.userId, req.body.productId)` |
| GET | `/api/transactions/my` | Required | Tìm transactions có `buyerId` hoặc `sellerId` = userId |
| GET | `/api/transactions/:id` | Required | Tìm transaction, verify buyer/seller, unmask contact info |
| POST | `/api/transactions/:id/handover` | Required | Gọi `escrowService.confirmHandover(id, req.userId)` |
| POST | `/api/transactions/:id/complete` | Required | Gọi `escrowService.finalizeTransaction(id)` — chỉ buyer |
| POST | `/api/transactions/:id/dispute` | Required | Gọi `escrowService.fileDispute(id, req.userId, reason, images)` |

---

### `routes/wallet.ts` ❌ TODO

| Method | Endpoint | Auth | Mô tả |
|:---|:---|:---|:---|
| GET | `/api/wallet/balance` | Required | Trả `{ xuBalance, xuFrozen, welcomeCreditRemaining }` |
| POST | `/api/wallet/topup` | Required | Body: `{ xuAmount: number }`. Cộng Xu vào user balance. Tạo VietQR URL. |
| POST | `/api/wallet/withdraw` | Required | Body: `{ xuAmount, bankName, accountNumber, accountHolder }`. Validate balance >= amount. Trừ Xu. Tính phí 10%. Tạo WithdrawRequest. |
| GET | `/api/wallet/history` | Required | Lấy lịch sử: transactions + withdraw requests |

**Công thức phí rút:**
```
vndAmount = xuAmount × 10000
feeVnd = vndAmount × 0.1
payoutVnd = vndAmount - feeVnd
```

---

### `routes/chat.ts` ❌ TODO

> **Real-time đã được xử lý bởi Socket.IO** trong [`server/src/socket/chatHandler.ts`](file:///d:/Kindr/server/src/socket/chatHandler.ts). REST route chỉ dùng cho lịch sử.

| Method | Endpoint | Auth | Mô tả |
|:---|:---|:---|:---|
| GET | `/api/chats` | Required | Lấy danh sách chats có `buyerId` hoặc `sellerId` = userId. Sort by `lastMessageTime` desc |
| GET | `/api/chats/:id/messages` | Required | Lấy messages theo chatId. Pagination: `?page=1&limit=50`. Sort by `createdAt` asc |
| POST | `/api/chats` | Required | Tạo chat session mới. Body: `{ productId, sellerId }`. Kiểm tra duplicate |

---

### `routes/notifications.ts` ❌ TODO

| Method | Endpoint | Auth | Mô tả |
|:---|:---|:---|:---|
| GET | `/api/notifications` | Required | Lấy notifications của user. `?page=1&limit=20`. Sort by `createdAt` desc |
| PUT | `/api/notifications/:id/read` | Required | Đánh dấu đã đọc |
| PUT | `/api/notifications/read-all` | Required | Đánh dấu tất cả đã đọc |
| GET | `/api/notifications/unread-count` | Required | Trả `{ count: number }` |

---

### `routes/ratings.ts` ❌ TODO

| Method | Endpoint | Auth | Mô tả |
|:---|:---|:---|:---|
| POST | `/api/ratings` | Required | Body: `{ transactionId, stars, comment, tags }`. Validate: chỉ buyer/seller trong transaction, chưa rate. Cập nhật `buyerRated`/`sellerRated` trong Transaction. Tính Civilization Points cho partner. |
| GET | `/api/ratings/user/:userId` | Optional | Lấy tất cả đánh giá cho 1 user |

**Quy tắc Civilization Points khi nhận rating:**
- 5 sao: +5 điểm
- 4 sao: +2 điểm
- 3 sao: +0 điểm
- 1-2 sao: -5 điểm

---

### `routes/reports.ts` ❌ TODO

| Method | Endpoint | Auth | Mô tả |
|:---|:---|:---|:---|
| POST | `/api/reports` | Required | Body: `{ targetType, targetId, reason }` |
| GET | `/api/reports/my` | Required | Lấy reports tôi đã gửi |

---

### `routes/admin.ts` ❌ TODO

> Tất cả endpoints cần `requireAuth` + `requireAdmin`.

| Method | Endpoint | Mô tả |
|:---|:---|:---|
| GET | `/api/admin/dashboard` | Stats: tổng users, products, transactions, revenue |
| GET | `/api/admin/users` | Danh sách users + filter/search |
| PUT | `/api/admin/users/:id/lock` | Khóa tài khoản |
| PUT | `/api/admin/users/:id/unlock` | Mở khóa |
| GET | `/api/admin/products` | Tất cả products kể cả removed |
| DELETE | `/api/admin/products/:id` | Xóa sản phẩm vi phạm |
| GET | `/api/admin/transactions` | Tất cả transactions |
| GET | `/api/admin/disputes` | Transactions có status='disputed' |
| PUT | `/api/admin/disputes/:id/resolve` | Body: `{ outcome: 'resolved_buyer' \| 'resolved_seller' }`. Gọi `escrowService.resolveDispute()` |
| GET | `/api/admin/withdraws` | WithdrawRequests pending |
| PUT | `/api/admin/withdraws/:id/approve` | Duyệt rút Xu |
| PUT | `/api/admin/withdraws/:id/reject` | Từ chối rút Xu (hoàn Xu lại) |
| GET | `/api/admin/reports` | Tất cả reports |
| PUT | `/api/admin/reports/:id` | Update status report |

---

### `routes/care-handbook.ts` ❌ TODO (Thấp ưu tiên)

> Sổ Tay Mẹ Bỉm — hiện tại FE dùng data local. Backend chỉ cần khi muốn persist.

| Method | Endpoint | Auth | Mô tả |
|:---|:---|:---|:---|
| GET/POST | `/api/care/vaccines` | Required | CRUD vaccine doses cho user |
| GET/POST | `/api/care/growth` | Required | CRUD growth records |
| GET/POST | `/api/care/reviews` | Required | CRUD community reviews |

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
