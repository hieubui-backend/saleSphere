# SaleSphere Backend

SaleSphere Backend là một hệ thống RESTful API được xây dựng cho nền tảng thương mại điện tử (e-commerce). Dự án được thiết kế với tiêu chuẩn cao về mặt kỹ thuật, áp dụng **Clean Architecture** (Kiến trúc sạch) và **Domain-Driven Design (DDD)** nhằm đảm bảo khả năng mở rộng, dễ bảo trì và dễ dàng kiểm thử.

## 🚀 Công nghệ sử dụng

*   **Runtime:** [Node.js](https://nodejs.org/)
*   **Framework:** [Express.js](https://expressjs.com/) & TypeScript
*   **Cơ sở dữ liệu:** [MongoDB](https://www.mongodb.com/) (thông qua [Mongoose](https://mongoosejs.com/))
*   **Dependency Injection (DI):** [Awilix](https://github.com/jeffijoe/awilix)
*   **Bảo mật:** JWT (JSON Web Tokens), BcryptJS, Helmet, HPP, XSS-Clean, Express-Mongo-Sanitize
*   **Xác thực dữ liệu:** Joi
*   **Real-time:** Socket.io
*   **Thanh toán:** Tích hợp VNPay
*   **Tài liệu API:** Swagger (OpenAPI)
*   **Logging:** Winston & Morgan
*   **Template Engine:** EJS (Dùng cho giao diện email hoặc view phụ)

## 🏗️ Kiến trúc & Design Patterns

Dự án áp dụng chặt chẽ các mẫu thiết kế và nguyên lý kỹ thuật phần mềm:

### 1. Clean Architecture & DDD
Hệ thống được chia thành các lớp (layers) rõ ràng:
*   **`src/domain`**: Chứa logic nghiệp vụ cốt lõi, hoàn toàn độc lập với các công nghệ bên ngoài (Framework, Database). Bao gồm các *Entities*, *Value Objects*, *Domain Services* và *Repository Interfaces*.
*   **`src/application`**: Chứa các *Use Cases* điều phối luồng nghiệp vụ của ứng dụng.
*   **`src/infrastructure`**: Thể hiện các chi tiết kỹ thuật như kết nối Database (Mongoose models), các *Repository Implementations*, và kết nối với các dịch vụ bên ngoài (Payment, Logging).
*   **`src/presentation`**: Lớp giao tiếp với người dùng (HTTP/API). Bao gồm các *Controllers*, *Routes*, và *DTOs* (Data Transfer Objects).

### 2. Các Design Patterns Nổi Bật
*   **Dependency Injection (DI)**: Sử dụng Awilix container để nạp các dependencies, giúp giảm sự phụ thuộc cứng giữa các modules.
*   **Repository Pattern**: Tách rời truy xuất dữ liệu database khỏi logic nghiệp vụ.
*   **Data Mapper Pattern**: Các `Mapper` class dùng để chuyển đổi qua lại giữa Domain Entities và Database Models.
*   **State Machine Pattern**: Quản lý tính toàn vẹn của vòng đời trạng thái đơn hàng (Order Status transitions).
*   **Middleware Pattern**: Xử lý logic chung xuyên suốt toàn ứng dụng như phân quyền, bắt lỗi, ghi log.

## 📦 Cấu trúc thư mục

```text
salesphere-backend/
├── src/
│   ├── application/     # Các Use Cases điều phối nghiệp vụ
│   ├── config/          # Cấu hình môi trường (DB, Server, VNPay)
│   ├── di/              # Cấu hình Dependency Injection (Awilix Container)
│   ├── domain/          # Logic cốt lõi (Entities, Enums, Services, Interfaces)
│   ├── infrastructure/  # Tương tác DB, API bên ngoài, Mappers
│   ├── middlewares/     # Express middlewares (Auth, Error handler, Validation)
│   ├── presentation/    # Controllers, DTOs, API Routes
│   ├── types/           # Định nghĩa Type/Interface Typescript toàn cục
│   ├── utils/           # Các hàm hỗ trợ (Helpers)
│   └── server.ts        # Entry point của ứng dụng
├── docs/                # Chứa tài liệu dự án, API Swagger
├── views/               # EJS template files
├── tests/               # Unit / Integration Tests
├── public/              # Chứa các file tĩnh (static assets)
├── logs/                # Nơi chứa các file log của Winston
├── package.json
└── tsconfig.json
```

## ⚙️ Yêu cầu hệ thống

*   Node.js (v18 trở lên)
*   MongoDB (Local hoặc MongoDB Atlas)
*   TypeScript toàn cầu (Khuyến nghị)

## 🛠️ Cài đặt & Khởi chạy

**1. Clone dự án và cài đặt các dependencies:**
```bash
npm install
```

**2. Cấu hình biến môi trường:**
Tạo file `.env` ở thư mục gốc của dự án và khai báo các thông số sau (Tham khảo thông số bên dưới hoặc `.env.example` nếu có):

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/?appName=Cluster0
JWT_SECRET=your_jwt_secret_key
CORS_ORIGIN=http://localhost:5173
```

**3. Seed tài khoản Admin (Tuỳ chọn):**
Tạo sẵn tài khoản quản trị viên:
```bash
npm run seed:admin
```

**4. Khởi chạy dự án (Môi trường phát triển):**
```bash
npm run dev
```

**5. Build & Chạy trên môi trường Production:**
```bash
npm run build
npm start
```

## 📜 API Documentation (Swagger)
Sau khi ứng dụng chạy thành công, truy cập tài liệu API tự động qua đường dẫn:
```text
http://localhost:5000/api-docs
```

## 📝 Danh sách Scripts (`package.json`)
*   `npm run dev`: Chạy server dev với `nodemon` và `ts-node`.
*   `npm run build`: Biên dịch TypeScript sang JavaScript vào thư mục `dist`.
*   `npm start`: Chạy server production từ thư mục `dist`.
*   `npm run seed:admin`: Chạy tệp tin seed để tạo một tài khoản Admin khởi tạo.
*   `npm run test`: Chạy bộ test bằng Jest.
