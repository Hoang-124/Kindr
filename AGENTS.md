# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code.

---

# Kindr Agentic Engineering Guidelines & Mandatory Execution Protocol

## 🚨 MANDATORY AUTOMATIC SKILL EXECUTION RULE (Bắt Buộc Tự Động Thực Thi)

Khi người dùng đưa ra **BẤT KỲ YÊU CẦU NÀO** (lập trình, sửa lỗi, làm giao diện, tối ưu code, review hay tái cấu trúc), Agent **BẮT BUỘC PHẢI TỰ ĐỘNG** thực hiện các nguyên tắc sau mà **KHÔNG CẦN NGƯỜI DÙNG PHẢI GỌI TÊN SKILL HAY NHẮC LẠI**:

1. **Tự Động Kích Hoạt Master Protocol**: Luôn chạy qua chu trình 6 pha của [`engineering-stack`](file:///d:/Kindr/.agents/skills/engineering-stack/SKILL.md).
2. **Chủ Động Đọc Lại Chi Tiết Skill Khi Cần**: Tự động dùng `view_file` để đọc lại các file [`SKILL.md`](file:///d:/Kindr/.agents/skills/) tương ứng với tác vụ (ví dụ: `mattpocock-engineering` khi gặp bug, `ui-ux-pro-max` và `taste-design` khi dựng màn hình, `superpowers` khi lập plan TDD).
3. **Tuyệt Đối Không Vibe Coding**: Phải làm rõ giả định (Karpathy), lên plan ngắn gọn (Superpowers), ưu tiên thư viện có sẵn (Ponytail Laziness Ladder) trước khi sửa code.
4. **Tuân Thủ Tuyệt Đối [`DESIGN.md`](file:///d:/Kindr/DESIGN.md)**: Không bao giờ hardcode màu chết. Luôn đảm bảo touch target $\ge$ 44pt và tương phản chuẩn WCAG AA trên cả 2 theme.
5. **Tự Động Kiểm Duyệt 4 Lăng Kính (GStack)**: Mọi tính năng trước khi bàn giao phải tự kiểm tra qua góc nhìn của **CEO**, **Tech Lead**, **QA Lead**, và **Security Officer**.
6. **Xác Thực Tự Động**: Luôn chạy `npx tsc --noEmit` và kiểm tra test trước khi hoàn tất phản hồi.

---

## 🔴 BACKEND MANDATORY RULES (BẮT BUỘC)

> **Dự án Kindr có CẢ Frontend (client/src/) VÀ Backend (server/).** 

1. **BẮT BUỘC đọc [`BACKEND_SPEC.md`](file:///d:/Kindr/BACKEND_SPEC.md)** trước khi viết bất kỳ code backend nào. File này chứa API contract, DB schema, Socket.IO events, và business rules.
2. **Khi implement tính năng mới, PHẢI làm CẢ backend route VÀ frontend screen.** Không được chỉ làm 1 phía.
3. **Backend pattern:** Luôn copy pattern từ [`server/src/routes/auth.ts`](file:///d:/Kindr/server/src/routes/auth.ts) và [`server/src/routes/products.ts`](file:///d:/Kindr/server/src/routes/products.ts).
4. **Khi tạo route mới, BẮT BUỘC mount vào [`server/src/app.ts`](file:///d:/Kindr/server/src/app.ts).**
5. **Business logic Escrow đã có sẵn trong [`server/src/services/escrowService.ts`](file:///d:/Kindr/server/src/services/escrowService.ts).** Route chỉ cần gọi service functions.
6. **Real-time:** Dùng `emitToUser(userId, event, data)` từ [`server/src/socket/index.ts`](file:///d:/Kindr/server/src/socket/index.ts) để push notification/chat.
7. **Validation:** Dùng `Zod` schema cho mọi request body.

### Tech Stack Backend
- **Runtime:** Node.js + TypeScript
- **Framework:** Express.js
- **Database:** MongoDB + Mongoose
- **Auth:** JWT (Access + Refresh token rotation)
- **Real-time:** Socket.IO
- **Validation:** Zod

---

## Active Skills & Frameworks Directory

| Skill Name | Path | Vai Trò & Chuyên Môn |
| :--- | :--- | :--- |
| **`engineering-stack`** | [SKILL.md](file:///d:/Kindr/.agents/skills/engineering-stack/SKILL.md) | **Master Unified Protocol**: Chu trình kỹ thuật hợp nhất 12-in-1 tự động kích hoạt |
| `superpowers` | [SKILL.md](file:///d:/Kindr/.agents/skills/superpowers/SKILL.md) | Quy trình TDD (Red-Green-Refactor), Plan Writing, Code Review |
| `karpathy-guidelines` | [SKILL.md](file:///d:/Kindr/.agents/skills/karpathy-guidelines/SKILL.md) | 4 nguyên tắc: Think Before Coding, Simplicity First, Surgical Changes, Goal-Driven |
| `ponytail-minimalism` | [SKILL.md](file:///d:/Kindr/.agents/skills/ponytail-minimalism/SKILL.md) | Lazy Senior Developer, YAGNI, Laziness ladder, zero-bloat |
| `caveman-efficiency` | [SKILL.md](file:///d:/Kindr/.agents/skills/caveman-efficiency/SKILL.md) | Giao tiếp súc tích, signal-to-noise ratio cao, token efficiency |
| `ui-ux-pro-max` | [SKILL.md](file:///d:/Kindr/.agents/skills/ui-ux-pro-max/SKILL.md) | Design intelligence, bảng màu, typography, WCAG AA, touch ergonomics $\ge$ 44pt |
| `taste-design` | [SKILL.md](file:///d:/Kindr/.agents/skills/taste-design/SKILL.md) | Anti-slop UI craftsmanship, viền mờ tinh tế, tactile micro-interactions |
| `mattpocock-engineering` | [SKILL.md](file:///d:/Kindr/.agents/skills/mattpocock-engineering/SKILL.md) | 5-Step Diagnostic Protocol, strict TypeScript, safe refactoring |
| `hermes-agent` | [SKILL.md](file:///d:/Kindr/.agents/skills/hermes-agent/SKILL.md) | Persistent memory, knowledge accumulation, self-reflection loops |
| `anthropics-standard` | [SKILL.md](file:///d:/Kindr/.agents/skills/anthropics-standard/SKILL.md) | Cấu trúc skill chuẩn mực, Progressive Disclosure |
| `last30days-research` | [SKILL.md](file:///d:/Kindr/.agents/skills/last30days-research/SKILL.md) | Tra cứu tài liệu chuẩn Expo SDK 56 & React 19 thời gian thực |
| `awesome-design-md` | [SKILL.md](file:///d:/Kindr/.agents/skills/awesome-design-md/SKILL.md) | Đồng bộ và quản lý living [`DESIGN.md`](file:///d:/Kindr/DESIGN.md) |
| `gstack-workflow` | [SKILL.md](file:///d:/Kindr/.agents/skills/gstack-workflow/SKILL.md) | Vòng lặp Think-to-Ship & Review 4 lăng kính (CEO, Eng Manager, QA Lead, Security) |
