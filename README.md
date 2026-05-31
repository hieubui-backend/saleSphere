# SaleSphere Backend API

> **RESTful API** cho hệ thống thương mại điện tử SaleSphere – xây dựng theo **Clean Architecture** với **TypeScript**, tích hợp Redis Caching, BullMQ Queue, PayOS, và containerized bằng Docker.

[![Node.js](https://img.shields.io/badge/Node.js-20-green?logo=nodedotjs)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7-green?logo=mongodb)](https://www.mongodb.com/)
[![Redis](https://img.shields.io/badge/Redis-7-red?logo=redis)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-Compose-blue?logo=docker)](https://www.docker.com/)

---

## Tech Stack

| Lớp | Công nghệ |
|---|---|
| **Runtime** | Node.js 20 · TypeScript |
| **Framework** | Express.js |
| **Database** | MongoDB (Mongoose ODM) |
| **Cache** | Redis (ioredis) – Product Caching |
| **Message Queue** | BullMQ + Redis – Async Email Processing |
| **Authentication** | JWT · bcrypt |
| **Payment** | PayOS · VNPay |
| **Email** | Nodemailer (Gmail SMTP) |
| **Real-time** | Socket.io |
| **Container** | Docker · Docker Compose · Nginx |
| **DI Container** | Awilix |
| **Logging** | Winston · Morgan |
| **Validation** | Joi |
| **Security** | Helmet · express-rate-limit · HPP · XSS-Clean |
| **API Docs** | Swagger UI |
| **Testing** | Jest · Supertest |

---

## Kiến trúc hệ thống

```
                         Client / Frontend
                               │
                    ┌──────────▼──────────┐
                    │   Nginx (Port 80)    │  Reverse Proxy
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Express App        │  Presentation Layer
                    │   (Port 5000)        │  Controllers · Routes · DTOs
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Application        │  Business Logic
                    │   Use Cases          │  (Domain rules)
                    └──────┬──────┬───────┘
                           │      │
              ┌────────────▼──┐ ┌─▼────────────────┐
              │   MongoDB      │ │  Redis             │
              │  (Persistent   │ │  Cache + BullMQ    │
              │   Database)    │ │  Job Queue         │
              └────────────────┘ └──────────────────┘
```

### Clean Architecture Layers

```
src/
├── presentation/          # Controllers · Routes · DTOs
├── application/
│   └── use-cases/         # Business Logic
│       ├── auth/
│       ├── product/       # Redis cache tích hợp tại đây
│       ├── order/
│       ├── cart/
│       ├── payment/       # BullMQ email dispatch tại đây
│       └── customer/
├── domain/                # Entities · Repository Interfaces
├── infrastructure/
│   ├── cache/             # RedisService (Caching)
│   ├── database/          # Mongoose Models
│   ├── payment/           # PayOSGateway · VNPayGateway
│   ├── queue/             # EmailQueue + EmailWorker (BullMQ)
│   ├── repositories/      # MongoDB Repository Implementations
│   ├── security/          # BcryptHasher · TokenManager
│   └── services/          # EmailService (Nodemailer)
├── config/
├── di/                    # Awilix DI Container
└── middlewares/           # Auth · Rate Limit · Error · Sanitize
```

---

## Tính năng kỹ thuật nổi bật

### ⚡ Redis Caching – Chống Cache Avalanche

```
GET /api/products
  └─ Check Redis cache
       ├── HIT  → Trả về ngay (< 5ms)
       └── MISS → Query MongoDB → Cache lại (TTL ngẫu nhiên ±10%)
```

- **Randomized TTL**: Cộng thêm 5–10% thời gian ngẫu nhiên vào TTL → tránh hàng loạt key hết hạn cùng lúc → bảo vệ DB khỏi bị quá tải
- **Fail-safe**: Nếu Redis down, hệ thống tự bypass về MongoDB – không crash server

### 📧 BullMQ Queue – Email Bất đồng bộ

```
POST /api/payment/webhook → Đơn hàng xác nhận
  └─ Đẩy job vào Redis Queue (không block response)
         └─ EmailWorker chạy ngầm
               └─ Gửi email (Retry: 5s → 10s → 20s, tối đa 3 lần)
```

- **Exponential Backoff Retry**: Tự động thử lại khi SMTP lỗi tạm thời
- **Zero latency**: API response ngay lập tức, email xử lý background

### 🔒 Idempotency – Chống xử lý trùng

- Webhook PayOS kiểm tra `transactionId` trước khi update đơn hàng
- Dùng **MongoDB Session + Transaction** đảm bảo atomic operations

### 📦 Atomic Inventory – Ngăn Race Condition

- `findOneAndUpdate` với `{ stock: { $gte: quantity } }` và `$inc: { stock: -quantity }` trong 1 lệnh duy nhất
- Ngăn bán vượt tồn kho khi hàng trăm user checkout đồng thời

---

## API Endpoints

### Auth
| Method | Endpoint | Mô tả |
|---|---|---|
| `POST` | `/api/auth/register` | Đăng ký Admin |
| `POST` | `/api/auth/login` | Đăng nhập Admin |
| `POST` | `/api/customer/register` | Đăng ký Customer + gửi welcome email |
| `POST` | `/api/customer/login` | Đăng nhập Customer |

### Products
| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| `GET` | `/api/products` | Danh sách sản phẩm (cached) | Public |
| `GET` | `/api/products/:id` | Chi tiết sản phẩm (cached) | Public |
| `POST` | `/api/products` | Tạo sản phẩm | Admin |
| `PUT` | `/api/products/:id` | Cập nhật sản phẩm | Admin |
| `DELETE` | `/api/products/:id` | Xóa sản phẩm | Admin |

### Orders & Payment
| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| `POST` | `/api/orders/checkout` | Tạo đơn hàng (atomic inventory) | Customer |
| `GET` | `/api/orders` | Danh sách đơn hàng | Admin |
| `GET` | `/api/orders/my-orders` | Đơn hàng của tôi | Customer |
| `POST` | `/api/payment/payos/create` | Tạo link thanh toán PayOS | Customer |
| `POST` | `/api/payment/payos/webhook` | Webhook xác nhận thanh toán (idempotent) | — |

> 📄 Full API Docs: `http://localhost:5000/api-docs`

---

## Chạy Local (Development)

### Yêu cầu
- Node.js >= 20
- Docker & Docker Compose

### Cài đặt

```bash
# 1. Clone repo
git clone https://github.com/hieubui-backend/saleSphere.git
cd saleSphere

# 2. Cài dependencies
npm install

# 3. Tạo file .env
cp .env.example .env
# Mở .env và điền MONGO_URI, JWT_SECRET, PAYOS_*, MAIL_* ...

# 4. Khởi động Redis local
docker compose up redis -d

# 5. Chạy development server (hot-reload)
npm run dev
```

Server: `http://localhost:5000`  
Swagger: `http://localhost:5000/api-docs`

---

## Deploy lên VPS (Production)

```bash
# 1. Cài Docker trên VPS (Ubuntu)
curl -fsSL https://get.docker.com | sh

# 2. Clone và cấu hình
git clone https://github.com/hieubui-backend/saleSphere.git
cd saleSphere
cp .env.example .env
nano .env          # Điền giá trị production thực tế

# 3. Build và chạy toàn bộ stack
docker compose up -d --build

# 4. Kiểm tra
docker compose ps
curl http://localhost/
```

### Infrastructure sau khi deploy

| Container | Vai trò | Port |
|---|---|---|
| `salesphere-nginx` | Reverse Proxy | **80** (public) |
| `salesphere-app` | Node.js API | 5000 (internal) |
| `salesphere-mongodb` | Database | 27017 (internal) |
| `salesphere-redis` | Cache + Queue | 6379 (internal) |

---

## Biến môi trường

Xem file [`.env.example`](.env.example).

| Biến | Mô tả |
|---|---|
| `MONGO_URI` | MongoDB connection string |
| `REDIS_URL` | Redis URL (`redis://:password@host:6379`) |
| `JWT_SECRET` | Secret ký JWT token (≥ 32 chars) |
| `PAYOS_CLIENT_ID / API_KEY / CHECKSUM_KEY` | Credentials PayOS |
| `MAIL_USERNAME / MAIL_PASSWORD` | Gmail SMTP credentials |

---

## Scripts

```bash
npm run dev          # Development server (nodemon + ts-node)
npm run build        # Compile TypeScript → dist/
npm start            # Production server (từ dist/)
npm test             # Chạy Jest test suite
npm run test:cache   # Test Redis caching
npm run test:payment # Test idempotency webhook
npm run test:race    # Test race condition inventory
npm run seed:admin   # Tạo tài khoản Admin mặc định
```

---

## Tác giả

**Bui Van Hieu** – Backend Developer

[![GitHub](https://img.shields.io/badge/GitHub-hieubui--backend-black?logo=github)](https://github.com/hieubui-backend/saleSphere)
