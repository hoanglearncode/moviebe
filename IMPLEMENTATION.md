# Tài liệu Triển khai Backend — CineMax Movie Ticketing

**Stack**: Express 5 · TypeScript 5.9 · Prisma 6 · PostgreSQL · BullMQ · Redis · Winston · Zod 4

---

## Mục lục

1. [Tổng quan hệ thống](#1-tổng-quan-hệ-thống)
2. [Kiến trúc](#2-kiến-trúc)
3. [Cài đặt & Chạy local](#3-cài-đặt--chạy-local)
4. [Biến môi trường](#4-biến-môi-trường)
5. [Database Schema](#5-database-schema)
6. [Hệ thống module & API](#6-hệ-thống-module--api)
7. [Authentication & Authorization](#7-authentication--authorization)
8. [Queue & Background Jobs](#8-queue--background-jobs)
9. [Notification System](#9-notification-system)
10. [File Upload & Media](#10-file-upload--media)
11. [Error Handling](#11-error-handling)
12. [Logging & Monitoring](#12-logging--monitoring)
13. [Scripts & Commands](#13-scripts--commands)

---

## 1. Tổng quan hệ thống

CineMax là nền tảng đặt vé xem phim đa bên (multi-tenant):

- **User**: xem phim, đặt vé, thanh toán, nhận thông báo.
- **Partner (Rạp chiếu)**: quản lý phim, lịch chiếu, phòng chiếu, tài chính, rút tiền.
- **Admin**: quản trị toàn bộ nền tảng — duyệt partner, duyệt phim, phân tích, cài đặt hệ thống.

**Cổng mặc định**: `3000`
**Prefix API**: `/v1`

---

## 2. Kiến trúc

### 2.1 Hexagonal Architecture

```
HTTP Request
    │
    ▼
Express Router (src/index.ts)
    │
    ▼
Transport Adapter (infras/transport/http-service.ts)
    │  đọc req.body / params / headers, gọi use case
    ▼
UseCase (usecase/index.ts)
    │  business logic, validate Zod, ném domain errors
    ▼
Port Interfaces (interface/index.ts)
    │  dependency injection
    ▼
Infrastructure Adapters
    ├── Repository (infras/repository/repo.ts) → Prisma → PostgreSQL
    ├── Token Service (shared/token.ts) → JWT
    ├── Mail Service (share/component/mail.ts) → SMTP
    └── Queue (src/queue/) → BullMQ → Redis
```

### 2.2 Cấu trúc module chuẩn

```
src/modules/<module-name>/
├── index.ts                    # composition root — wire adapters + export router
├── interface/index.ts          # port interfaces (IRepository, IUseCase, ...)
├── usecase/index.ts            # business logic
├── model/dto.ts                # Zod schemas + DTO types
├── infras/
│   ├── transport/http-service.ts  # HTTP handlers
│   └── repository/repo.ts         # Prisma adapter
└── shared/                     # domain services nội bộ (token, hash, ...)
```

### 2.3 SOLID mapping

| Nguyên tắc                | Áp dụng                                                                |
| ------------------------- | ---------------------------------------------------------------------- |
| S — Single Responsibility | usecase (business), transport (HTTP), repository (persistence) độc lập |
| O — Open/Closed           | Thêm adapter mới bằng cách implement interface, không sửa use case     |
| L — Liskov                | Adapter phải thỏa mãn port interface contract                          |
| I — Interface Segregation | Interface nhỏ, focused (IAuthUserRepository, ITokenService...)         |
| D — Dependency Inversion  | UseCase phụ thuộc interface, không phụ thuộc Prisma trực tiếp          |

---

## 3. Cài đặt & Chạy local

### Yêu cầu

- Node.js ≥ 20
- PostgreSQL ≥ 14
- Redis ≥ 7

### Các bước

```bash
# 1. Cài dependencies
npm install

# 2. Tạo file .env (xem mục 4)
cp .env.example .env

# 3. Chạy migration database
npx prisma migrate dev

# 4. Seed dữ liệu mặc định
npm run seed

# 5. Chạy dev server (HTTP + queue workers cùng process)
npm run dev

# Hoặc chạy worker riêng
npm run dev:worker
```

### Build production

```bash
npm run build        # tsc → dist/
npm run start        # node dist/index.js
npm run start:worker # node dist/queue/worker.js
```

---

## 4. Biến môi trường

File `.env` — tất cả được validate bằng Zod khi khởi động (`src/share/common/value.ts`).

```env
# === SERVER ===
PORT=3000

# === DATABASE ===
DATABASE_URL=postgresql://user:password@localhost:5432/cinemax

# === JWT ===
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
AUTH_CONCURRENT_LOCK_TTL_MS=5000   # TTL lock race condition (ms)

# === ADMIN BOOTSTRAP ===
ADMIN_INIT_EMAIL=admin@example.com
ADMIN_INIT_PASSWORD=StrongPassword123!

# === OAUTH ===
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=

# === EMAIL (SMTP) ===
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your@gmail.com
SMTP_PASS=app_password
MAIL_FROM_EMAIL=noreply@cinemax.vn
MAIL_FROM_NAME=CineMax
FRONTEND_URL=http://localhost:3001

# === REDIS ===
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_USERNAME=
REDIS_PASSWORD=
REDIS_DB=0

# === QUEUE (BullMQ) ===
QUEUE_PREFIX=movie-be
QUEUE_JOB_ATTEMPTS=3
QUEUE_JOB_BACKOFF_MS=1000
QUEUE_REMOVE_ON_COMPLETE_COUNT=100
QUEUE_REMOVE_ON_FAIL_COUNT=500

# === PUSHER (real-time) ===
PUSHER_APP_ID=
PUSHER_KEY=
PUSHER_SECRET=
PUSHER_CLUSTER=ap1

# === CLOUDINARY (file upload) ===
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

---

## 5. Database Schema

### 5.1 Các nhóm model chính (24 bảng)

#### User & Auth

| Model                    | Mô tả                                               |
| ------------------------ | --------------------------------------------------- |
| `User`                   | Tài khoản người dùng — role: USER / ADMIN / PARTNER |
| `UserSetting`            | Tùy chọn thông báo của user                         |
| `Session`                | Phiên đăng nhập, tracking thiết bị & IP             |
| `PasswordResetToken`     | Token reset mật khẩu (single-use)                   |
| `EmailVerificationToken` | Token xác thực email                                |

#### Partner & Cinema

| Model            | Mô tả                                                        |
| ---------------- | ------------------------------------------------------------ |
| `Partner`        | Thông tin rạp chiếu phim (tên, địa chỉ, ngân hàng, hoa hồng) |
| `PartnerRequest` | Yêu cầu đăng ký làm partner — cần admin duyệt                |
| `PartnerStaff`   | Nhân viên rạp (OWNER / MANAGER / CASHIER / SCANNER / STAFF)  |
| `PartnerSetting` | Cài đặt thông báo & rút tiền tự động                         |
| `PartnerWallet`  | Ví điện tử của partner                                       |

#### Movie & Showtime

| Model          | Mô tả                                                        |
| -------------- | ------------------------------------------------------------ |
| `Movie`        | Phim — status: DRAFT → SUBMITTED → APPROVED → ACTIVE         |
| `Category`     | Thể loại phim (có hierarchy parent_id)                       |
| `Cast`         | Diễn viên của phim                                           |
| `Showtime`     | Lịch chiếu — giá vé, số ghế còn lại                          |
| `Room`         | Phòng chiếu (2D / 3D / IMAX / VIP / 4DX)                     |
| `Seat`         | Ghế ngồi — status: AVAILABLE / LOCKED / BOOKED / MAINTENANCE |
| `SeatTemplate` | Template layout ghế cho phòng                                |

#### Booking & Ticket

| Model         | Mô tả                                                           |
| ------------- | --------------------------------------------------------------- |
| `Order`       | Đơn đặt vé — status: PENDING → COMPLETED / CANCELLED / REFUNDED |
| `Ticket`      | Vé lẻ — status: RESERVED → CONFIRMED → USED / PASSED            |
| `Transaction` | Giao dịch tài chính (bán vé, rút tiền, hoàn tiền)               |
| `CheckIn`     | Lịch sử quét vé vào rạp                                         |
| `PassHistory` | Lịch sử chuyển nhượng vé giữa users                             |

#### Finance

| Model        | Mô tả                                        |
| ------------ | -------------------------------------------- |
| `Withdrawal` | Yêu cầu rút tiền của partner                 |
| `Service`    | Dịch vụ phụ trợ của rạp (bỏng ngô, nước,...) |
| `Plan`       | Gói subscription                             |

#### Moderation

| Model    | Mô tả                                                         |
| -------- | ------------------------------------------------------------- |
| `Review` | Đánh giá phim — status: PENDING / APPROVED / HIDDEN / REMOVED |
| `Report` | Báo cáo vi phạm nội dung                                      |

#### Platform Config

| Model                        | Mô tả                                              |
| ---------------------------- | -------------------------------------------------- |
| `SystemSetting`              | Cài đặt hệ thống dạng key-value                    |
| `FeatureFlag`                | Feature toggle (RELEASE / EXPERIMENT / BETA / OPS) |
| `AuditLog`                   | Audit trail mọi hành động admin                    |
| `Notification`               | Thông báo in-app cho user                          |
| `EmailTemplate`              | Template email theo event                          |
| `ScheduledEmailNotification` | Email đã được lên lịch gửi                         |
| `BroadcastNotification`      | Thông báo broadcast tới nhóm user                  |

### 5.2 Enum trạng thái quan trọng

```
OrderStatus:   PENDING → PAYMENT_PROCESSING → COMPLETED
                                             → EXPIRED
                                             → CANCELLED
                                             → REFUND_REQUESTED → REFUNDED

TicketStatus:  RESERVED → CONFIRMED → USED
                                    → CANCELLED
                                    → REFUNDED
                                    → PASSED

MovieStatus:   DRAFT → SUBMITTED → APPROVED → ACTIVE
                                 → REJECTED
                                 → INACTIVE

UserStatus:    ACTIVE | INACTIVE | BANNED | PENDING
```

---

## 6. Hệ thống module & API

### 6.1 Authentication — `/v1/auth`

| Method | Endpoint                 | Auth | Mô tả                    |
| ------ | ------------------------ | ---- | ------------------------ |
| POST   | `/register`              | —    | Đăng ký tài khoản        |
| POST   | `/login`                 | —    | Đăng nhập email/password |
| POST   | `/google/callback`       | —    | Google OAuth2            |
| POST   | `/google/callback/token` | —    | Google ID Token login    |
| POST   | `/facebook/callback`     | —    | Facebook OAuth2          |
| POST   | `/refresh-token`         | —    | Làm mới access token     |
| POST   | `/verify-email`          | —    | Xác thực email qua token |
| POST   | `/resend-verification`   | —    | Gửi lại email xác thực   |
| POST   | `/forgot-password`       | —    | Yêu cầu reset mật khẩu   |
| POST   | `/change-password`       | ✓    | Đổi mật khẩu             |

**Token flow**:

- `accessToken`: JWT ngắn hạn (default 15m), gửi qua `Authorization: Bearer <token>`
- `refreshToken`: JWT dài hạn (default 7d), dùng để lấy access token mới
- Concurrent lock (Redis) ngăn race condition khi register/login đồng thời

---

### 6.2 User — `/v1/user`

| Method | Endpoint               | Auth | Mô tả                     |
| ------ | ---------------------- | ---- | ------------------------- |
| GET    | `/me`                  | ✓    | Lấy thông tin profile     |
| PUT    | `/me`                  | ✓    | Cập nhật profile          |
| DELETE | `/me`                  | ✓    | Xóa tài khoản             |
| POST   | `/change-password`     | ✓    | Đổi mật khẩu              |
| GET    | `/sessions`            | ✓    | Danh sách phiên đăng nhập |
| DELETE | `/sessions/:sessionId` | ✓    | Thu hồi phiên cụ thể      |
| DELETE | `/sessions`            | ✓    | Thu hồi tất cả phiên      |

**Admin quản lý user** — `/v1/admin/users`:

| Method | Endpoint     | Mô tả                               |
| ------ | ------------ | ----------------------------------- |
| GET    | `/`          | Danh sách user (filter, phân trang) |
| GET    | `/:id`       | Chi tiết user                       |
| PATCH  | `/:id`       | Cập nhật thông tin user             |
| DELETE | `/:id`       | Xóa user                            |
| GET    | `/stats`     | Thống kê user                       |
| POST   | `/:id/ban`   | Ban user                            |
| POST   | `/:id/unban` | Unban user                          |

---

### 6.3 Movie & Showtime — Public, `/v1/movies`, `/v1/showtimes`

| Method | Endpoint                       | Auth | Mô tả                                                |
| ------ | ------------------------------ | ---- | ---------------------------------------------------- |
| GET    | `/movies/`                     | —    | Danh sách phim (search, filter thể loại, phân trang) |
| GET    | `/movies/:id`                  | —    | Chi tiết phim                                        |
| GET    | `/movies/:id/showtimes`        | —    | Lịch chiếu của phim                                  |
| GET    | `/showtimes/:showtimeId`       | —    | Chi tiết suất chiếu                                  |
| GET    | `/showtimes/:showtimeId/seats` | —    | Sơ đồ ghế ngồi                                       |

---

### 6.4 Category — `/v1/categories`

| Method | Endpoint | Auth  | Mô tả              |
| ------ | -------- | ----- | ------------------ |
| GET    | `/`      | —     | Danh sách thể loại |
| GET    | `/:id`   | —     | Chi tiết thể loại  |
| POST   | `/`      | Admin | Tạo thể loại       |
| PATCH  | `/:id`   | Admin | Cập nhật thể loại  |
| DELETE | `/:id`   | Admin | Xóa thể loại       |

---

### 6.5 Cinema — Public, `/v1/cinemas`

| Method | Endpoint  | Mô tả                                            |
| ------ | --------- | ------------------------------------------------ |
| GET    | `/`       | Danh sách rạp (filter: city, search, phân trang) |
| GET    | `/cities` | Danh sách thành phố có rạp                       |
| GET    | `/:id`    | Chi tiết rạp                                     |

---

### 6.6 Booking — `/v1/booking`

| Method | Endpoint      | Auth     | Mô tả                   |
| ------ | ------------- | -------- | ----------------------- |
| POST   | `/lock-seats` | ✓ Active | Khóa ghế & tạo đơn hàng |
| GET    | `/:orderId`   | ✓ Active | Chi tiết đơn hàng       |
| DELETE | `/:orderId`   | ✓ Active | Hủy đơn hàng            |

**Booking flow**:

1. `POST /lock-seats` → tạo `Order` (PENDING) + `Ticket` (RESERVED) + khóa `Seat`
2. `POST /payment/create` → chuyển order sang PAYMENT_PROCESSING
3. Webhook payment → chuyển order sang COMPLETED, ticket sang CONFIRMED
4. Seat cleanup worker tự động giải phóng ghế khi order hết hạn

---

### 6.7 Payment — `/v1/payment`

| Method | Endpoint           | Auth     | Mô tả                         |
| ------ | ------------------ | -------- | ----------------------------- |
| POST   | `/create`          | ✓ Active | Khởi tạo thanh toán (PayOS)   |
| GET    | `/status/:orderId` | ✓ Active | Trạng thái thanh toán         |
| POST   | `/confirm-mock`    | ✓ Active | Xác nhận thanh toán giả (dev) |

**Payment gateway**: PayOS (`@payos/node`)

---

### 6.8 Ticket — `/v1/tickets`

| Method | Endpoint        | Auth     | Mô tả                    |
| ------ | --------------- | -------- | ------------------------ |
| GET    | `/`             | ✓ Active | Danh sách vé của user    |
| GET    | `/:ticketId`    | ✓ Active | Chi tiết vé + QR code    |
| GET    | `/pass-history` | ✓ Active | Lịch sử chuyển nhượng vé |

---

### 6.9 Partner Request — `/v1/user/partner-request`

| Method | Endpoint           | Auth | Mô tả                       |
| ------ | ------------------ | ---- | --------------------------- |
| POST   | `/partner-request` | ✓    | Nộp đơn đăng ký làm partner |
| PATCH  | `/partner-request` | ✓    | Chỉnh sửa đơn đang chờ      |
| GET    | `/partner-request` | ✓    | Xem trạng thái đơn          |

---

### 6.10 Partner Dashboard — `/v1/partner`

**Profile**

| Method | Endpoint  | Mô tả              |
| ------ | --------- | ------------------ |
| GET    | `/me`     | Thông tin partner  |
| PUT    | `/me`     | Cập nhật thông tin |
| GET    | `/status` | Trạng thái partner |

**Phim**

| Method | Endpoint             | Mô tả                      |
| ------ | -------------------- | -------------------------- |
| POST   | `/movies/`           | Tạo phim mới (DRAFT)       |
| GET    | `/movies/`           | Danh sách phim của partner |
| PUT    | `/movies/:id`        | Cập nhật phim              |
| DELETE | `/movies/:id`        | Xóa phim                   |
| POST   | `/movies/:id/submit` | Nộp phim để admin duyệt    |

**Lịch chiếu**

| Method | Endpoint                   | Mô tả                |
| ------ | -------------------------- | -------------------- |
| POST   | `/showtimes/`              | Tạo lịch chiếu       |
| GET    | `/showtimes/`              | Danh sách lịch chiếu |
| PUT    | `/showtimes/:id`           | Cập nhật lịch chiếu  |
| DELETE | `/showtimes/:id`           | Xóa lịch chiếu       |
| GET    | `/showtimes/:id/seats`     | Danh sách ghế        |
| GET    | `/showtimes/:id/seat-map`  | Sơ đồ ghế            |
| GET    | `/showtimes/:id/check-ins` | Lịch sử check-in     |

**Phòng chiếu**

| Method | Endpoint     | Mô tả           |
| ------ | ------------ | --------------- |
| POST   | `/rooms/`    | Tạo phòng chiếu |
| GET    | `/rooms/`    | Danh sách phòng |
| PUT    | `/rooms/:id` | Cập nhật phòng  |
| DELETE | `/rooms/:id` | Xóa phòng       |

**Vé & Check-in**

| Method | Endpoint            | Mô tả           |
| ------ | ------------------- | --------------- |
| GET    | `/tickets/`         | Danh sách vé    |
| GET    | `/tickets/:id`      | Chi tiết vé     |
| POST   | `/tickets/check-in` | Quét vé vào rạp |

**Tài chính**

| Method | Endpoint           | Mô tả                      |
| ------ | ------------------ | -------------------------- |
| GET    | `/wallet`          | Thông tin ví               |
| GET    | `/transactions`    | Lịch sử giao dịch          |
| GET    | `/revenue`         | Báo cáo doanh thu          |
| POST   | `/withdrawals`     | Yêu cầu rút tiền           |
| GET    | `/withdrawals`     | Danh sách yêu cầu rút tiền |
| GET    | `/withdrawals/:id` | Chi tiết yêu cầu rút tiền  |

**Dashboard & Thống kê**

| Method | Endpoint            | Mô tả                   |
| ------ | ------------------- | ----------------------- |
| GET    | `/dashboard`        | Tổng quan dashboard     |
| GET    | `/stats/top-movies` | Top phim theo doanh thu |
| GET    | `/stats/occupancy`  | Tỷ lệ lấp đầy ghế       |

**Dịch vụ & Cài đặt**

| Method    | Endpoint          | Mô tả                                |
| --------- | ----------------- | ------------------------------------ |
| GET/POST  | `/services/`      | Quản lý dịch vụ phụ trợ              |
| GET/PATCH | `/settings`       | Cài đặt thông báo & tự động rút tiền |
| POST      | `/settings/reset` | Reset về mặc định                    |

---

### 6.11 Admin — Partner Management — `/v1/admin`

**Partner Requests**

| Method | Endpoint                        | Mô tả                 |
| ------ | ------------------------------- | --------------------- |
| GET    | `/partner-requests`             | Danh sách đơn đăng ký |
| GET    | `/partner-requests/stats`       | Thống kê đơn          |
| GET    | `/partner-requests/:id`         | Chi tiết đơn          |
| PUT    | `/partner-requests/:id/approve` | Duyệt đơn             |
| PUT    | `/partner-requests/:id/reject`  | Từ chối đơn           |
| PUT    | `/partner-requests/:id/reset`   | Reset trạng thái đơn  |

**Quản lý phim & partner**

| Method | Endpoint                   | Mô tả                         |
| ------ | -------------------------- | ----------------------------- |
| GET    | `/movies`                  | Danh sách phim đang chờ duyệt |
| GET    | `/movies/stats`            | Thống kê phim                 |
| PUT    | `/movies/:id/approve`      | Duyệt phim                    |
| PUT    | `/movies/:id/reject`       | Từ chối phim                  |
| GET    | `/partners`                | Danh sách partner             |
| PUT    | `/partners/:id/commission` | Cập nhật tỷ lệ hoa hồng       |

---

### 6.12 Admin — Analytics — `/v1/admin/analytics`

| Method | Endpoint    | Mô tả                             |
| ------ | ----------- | --------------------------------- |
| GET    | `/overview` | Tổng quan platform                |
| GET    | `/revenue`  | Doanh thu theo kỳ (7d/30d/90d/1y) |
| GET    | `/users`    | Thống kê người dùng               |
| GET    | `/content`  | Thống kê nội dung                 |
| GET    | `/health`   | Trạng thái hệ thống               |

---

### 6.13 Admin — Finance — `/v1/admin/finance`

| Method | Endpoint                    | Mô tả                           |
| ------ | --------------------------- | ------------------------------- |
| GET    | `/summary`                  | Tổng hợp tài chính              |
| GET    | `/revenue-trend`            | Xu hướng doanh thu              |
| GET    | `/transactions`             | Lịch sử giao dịch toàn platform |
| GET    | `/withdrawals`              | Danh sách yêu cầu rút tiền      |
| PATCH  | `/withdrawals/:id/approve`  | Duyệt rút tiền                  |
| PATCH  | `/withdrawals/:id/complete` | Hoàn tất rút tiền               |
| PATCH  | `/withdrawals/:id/reject`   | Từ chối rút tiền                |
| GET    | `/plan-distribution`        | Phân bổ gói subscription        |

---

### 6.14 Admin — Review Moderation — `/v1/admin/reviews`

| Method | Endpoint      | Mô tả                            |
| ------ | ------------- | -------------------------------- |
| GET    | `/`           | Danh sách review (filter status) |
| PATCH  | `/:id/status` | Đổi trạng thái review            |
| DELETE | `/:id`        | Xóa review                       |

---

### 6.15 Admin — Reports — `/v1/admin/reports`

| Method | Endpoint       | Mô tả                                                        |
| ------ | -------------- | ------------------------------------------------------------ |
| GET    | `/`            | Danh sách báo cáo vi phạm (filter: status, target, priority) |
| PATCH  | `/:id/resolve` | Giải quyết báo cáo                                           |
| PATCH  | `/:id/dismiss` | Bỏ qua báo cáo                                               |
| PATCH  | `/:id/status`  | Cập nhật trạng thái                                          |

**Loại target**: COMMENT / USER / MOVIE / OWNER / REVIEW
**Lý do**: SPAM / HARASSMENT / HATE_SPEECH / MISINFORMATION / ADULT_CONTENT / VIOLENCE / COPYRIGHT / SCAM / IMPERSONATION / OTHER

---

### 6.16 Admin — Feature Flags — `/v1/admin/feature-flags`

| Method | Endpoint              | Mô tả                                       |
| ------ | --------------------- | ------------------------------------------- |
| GET    | `/`                   | Danh sách flags (filter: env, type, search) |
| POST   | `/`                   | Tạo flag mới                                |
| PATCH  | `/:id`                | Cập nhật flag                               |
| PATCH  | `/:id/toggle`         | Bật/tắt flag                                |
| POST   | `/emergency-shutdown` | Tắt khẩn cấp tất cả flags                   |
| DELETE | `/:id`                | Xóa flag                                    |

**Loại**: RELEASE / EXPERIMENT / BETA / OPS / EXPERIMENTAL
**Môi trường**: PRODUCTION / STAGING / DEVELOPMENT
Hỗ trợ: rollout percentage, target users list.

---

### 6.17 Admin — Audit Logs — `/v1/admin/audit-logs`

| Method | Endpoint | Mô tả                                                                    |
| ------ | -------- | ------------------------------------------------------------------------ |
| GET    | `/`      | Lịch sử hành động admin (filter: category, severity, search, date range) |

---

### 6.18 Admin — Plans — `/v1/admin/plans`

| Method | Endpoint      | Mô tả         |
| ------ | ------------- | ------------- |
| GET    | `/`           | Danh sách gói |
| POST   | `/`           | Tạo gói mới   |
| PATCH  | `/:id`        | Cập nhật gói  |
| PATCH  | `/:id/toggle` | Bật/tắt gói   |
| DELETE | `/:id`        | Xóa gói       |

---

### 6.19 Admin — System Settings — `/v1/admin/system-settings`

| Method | Endpoint  | Mô tả               |
| ------ | --------- | ------------------- |
| GET    | `/`       | Lấy tất cả cài đặt  |
| PATCH  | `/`       | Cập nhật cài đặt    |
| GET    | `/status` | Trạng thái hệ thống |

**Public endpoint** (không cần auth, accessible kể cả maintenance mode):

| Method | Endpoint       | Mô tả                                                                  |
| ------ | -------------- | ---------------------------------------------------------------------- |
| GET    | `/v1/settings` | siteName, defaultLanguage, timezone, maintenanceMode, registrationOpen |

---

### 6.20 Notifications — `/v1/notifications`

| Method | Endpoint    | Auth | Mô tả                  |
| ------ | ----------- | ---- | ---------------------- |
| GET    | `/`         | ✓    | Danh sách thông báo    |
| PATCH  | `/:id/read` | ✓    | Đánh dấu đã đọc        |
| PATCH  | `/read-all` | ✓    | Đánh dấu tất cả đã đọc |

**Admin Email** — `/v1/admin/email`:
Quản lý email templates và scheduled notifications.

---

## 7. Authentication & Authorization

### 7.1 Middleware stack

```
src/share/middleware/auth.ts
```

| Middleware                       | Mô tả                                  |
| -------------------------------- | -------------------------------------- |
| `authMiddleware`                 | Validate JWT, gắn user vào `req.user`  |
| `authenticate`                   | Load full user context từ DB           |
| `protect`                        | Yêu cầu đăng nhập hợp lệ               |
| `requireRole(...roles)`          | Kiểm tra role (USER / ADMIN / PARTNER) |
| `requireActiveUser`              | Chặn user bị BANNED / INACTIVE         |
| `requirePermission(perm)`        | Kiểm tra granular permission           |
| `requireAnyPermission(...perms)` | Đủ 1 trong N permission                |
| `requireSelfOrPermission(perm)`  | Chủ sở hữu hoặc có permission          |

### 7.2 Permission codes

Định nghĩa tại `src/share/security/permissions.ts`.

Nhóm chính:

- `VIEW_OWN_PROFILE`, `UPDATE_OWN_PROFILE`, `DELETE_OWN_ACCOUNT`
- `CHANGE_OWN_PASSWORD`, `VIEW_OWN_SESSIONS`, `REVOKE_OWN_SESSIONS`
- `VIEW_USERS`, `UPDATE_USERS`, `BAN_USERS`, `VIEW_USER_STATS`
- `MANAGE_MOVIES`, `APPROVE_MOVIES`, `MANAGE_PARTNERS`
- `VIEW_ANALYTICS`, `MANAGE_SYSTEM_SETTINGS`, `MANAGE_FEATURE_FLAGS`
- `MANAGE_AUDIT_LOGS`, `MANAGE_FINANCE`, `MANAGE_WITHDRAWALS`

### 7.3 Maintenance mode

Middleware `maintenanceModeGuard` chặn tất cả request khi `maintenanceMode=true`, ngoại trừ:

- `GET /v1/settings` (public config)
- Admin endpoints (ADMIN role)

---

## 8. Queue & Background Jobs

### 8.1 Infrastructure

- **Driver**: BullMQ + Redis (ioredis)
- **Config**: `src/queue/config/config.ts`
- **Init/Shutdown**: `src/queue/index.ts`

```
src/queue/
├── config/config.ts          # queue & Redis config
├── index.ts                  # initialize + shutdown
├── health.ts                 # health check
├── email.queue.ts            # email queue definition
├── notification.queue.ts     # notification queue
├── broadcast.queue.ts        # broadcast queue
└── worker/
    ├── email.worker.ts       # process email jobs
    ├── notification.worker.ts
    ├── scheduled-email.worker.ts
    ├── broadcast.worker.ts
    └── seat-cleanup.worker.ts
```

### 8.2 Các queue

| Queue             | Mục đích                        | Job retry                  |
| ----------------- | ------------------------------- | -------------------------- |
| `email`           | Gửi email giao dịch             | 3 lần, exponential backoff |
| `notification`    | Push notification tới user      | 3 lần                      |
| `scheduled-email` | Email đã lên lịch gửi theo cron | 3 lần                      |
| `broadcast`       | Broadcast tới nhóm user         | 3 lần                      |
| `seat-cleanup`    | Giải phóng ghế bị khóa quá hạn  | —                          |

### 8.3 Email event types

```
VERIFY_EMAIL
RESET_PASSWORD
WELCOME_NEW_ACCOUNT
ACCOUNT_UPDATED_BY_ADMIN
PASSWORD_CHANGED
LOGIN_WARNING
PROMO_CAMPAIGN
ACCOUNT_DELETED
```

### 8.4 Notification types

```
PARTNER_WITHDRAWAL_PENDING
BOOKING_CONFIRMED
TICKET_REFUNDED
SHOWTIME_CANCELLED
(và các loại khác định nghĩa trong NotificationType enum)
```

---

## 9. Notification System

### 9.1 Kênh thông báo

| Kênh      | Công nghệ          | Mô tả                             |
| --------- | ------------------ | --------------------------------- |
| Email     | Nodemailer + SMTP  | Transactional & marketing emails  |
| In-app    | Pusher (WebSocket) | Real-time notifications trong app |
| Broadcast | BullMQ             | Admin gửi tới nhóm user           |

### 9.2 Email templates

Templates được seed tự động khi khởi động server (`seedEmailTemplates`).
Quản lý qua Admin Email API (`/v1/admin/email`).

### 9.3 Broadcast targets

`ALL` / `USERS` / `OWNERS` / `VIP` / `PREMIUM` / `FREE`

### 9.4 Pusher authentication

`GET /v1/pusher/auth` — xác thực channel Pusher cho user.

---

## 10. File Upload & Media

- **Provider**: Cloudinary
- **Middleware**: Multer (parse multipart/form-data)
- **Endpoint**: `POST /v1/upload`
- **Auth**: Bắt buộc (authenticated user)

```ts
// Cấu hình tại
src / share / transport / upload.router.ts;
src / share / common / cloudinary.ts;
```

---

## 11. Error Handling

### 11.1 Error classes — `src/share/model/base-error.ts`

| Class               | HTTP Status | Mô tả                        |
| ------------------- | ----------- | ---------------------------- |
| `ValidationError`   | 400         | Dữ liệu đầu vào không hợp lệ |
| `UnauthorizedError` | 401         | Chưa xác thực                |
| `ForbiddenError`    | 403         | Không có quyền               |
| `NotFoundError`     | 404         | Không tìm thấy resource      |
| `ConflictError`     | 409         | Xung đột (duplicate,...)     |

### 11.2 Response envelope

```json
// Success
{
  "success": true,
  "data": {},
  "paging": { "page": 1, "limit": 20, "total": 100 },
  "message": "optional"
}

// Error
{
  "code": "VALIDATION_ERROR",
  "message": "Email is required",
  "details": {}
}
```

### 11.3 Validation flow

1. Request vào Transport → gọi UseCase
2. UseCase gọi `zodSchema.parse(input)` → ném `ValidationError` nếu sai
3. Transport bắt error, gọi `BaseHttpService.handleRequest()` → format response

---

## 12. Logging & Monitoring

### 12.1 Winston logger

```ts
import { logger } from "./modules/system/log/logger";

logger.info("message", { userId, action, module });
logger.error("message", { error, context });
logger.warn("message", { detail });
```

Structured log với metadata: `userId`, `requestId`, `module`, `action`.

### 12.2 Request logger middleware

`src/modules/system/log/request-logger.ts` — log mọi HTTP request.

### 12.3 Prometheus metrics

`prom-client` — expose metrics tại endpoint `/metrics` (nếu được cấu hình).

### 12.4 Audit Logs

Mọi hành động admin được ghi vào bảng `AuditLog`:

- actor (user thực hiện), action, target, category, severity
- IP, device, location
- Xem qua `GET /v1/admin/audit-logs`

---

## 13. Scripts & Commands

```bash
# Development
npm run dev              # Chạy server + workers
npm run dev:worker       # Chỉ chạy workers

# Build & Production
npm run build            # TypeScript compile → dist/
npm run start            # Chạy production server
npm run start:worker     # Chạy production workers

# Database
npm run prisma:migrate   # Chạy migrations
npm run prisma:generate  # Regenerate Prisma Client
npm run prisma:studio    # Prisma Studio GUI
npm run seed             # Seed dữ liệu mặc định

# Code Quality
npm run lint             # ESLint
npm run format           # Prettier
npm run test             # Jest unit tests
npm run test:coverage    # Test + coverage report
```

---

## Phụ lục — Phụ thuộc chính

| Package        | Version  | Mục đích                |
| -------------- | -------- | ----------------------- |
| express        | ^5.2.1   | Web framework           |
| typescript     | ^5.9.3   | Type safety             |
| @prisma/client | ^6.19.2  | ORM — PostgreSQL        |
| bullmq         | ^5.73.1  | Queue — background jobs |
| ioredis        | ^5.10.1  | Redis client            |
| jsonwebtoken   | ^9.0.3   | JWT auth                |
| bcrypt         | ^6.0.0   | Password hashing        |
| zod            | ^4.3.6   | Schema validation       |
| nodemailer     | ^8.0.2   | Email sending           |
| pusher         | ^5.3.3   | Real-time notifications |
| cloudinary     | ^2.9.0   | Image storage           |
| multer         | ^2.1.1   | File upload             |
| @payos/node    | ^2.0.5   | Payment gateway         |
| winston        | ^3.19.0  | Structured logging      |
| passport       | ^0.7.0   | OAuth strategies        |
| socket.io      | ^4.8.3   | WebSocket               |
| prom-client    | ^15.1.3  | Prometheus metrics      |
| dayjs          | ^1.11.19 | Date manipulation       |
| uuid           | ^13.0.0  | UUID generation         |
