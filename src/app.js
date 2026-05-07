const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const helmet = require('helmet'); // Thêm helmet để bảo mật
const cors = require('cors'); // Thêm cors để xử lý request từ client khác domain
const http = require('http'); // Thêm http server để kết hợp socket.io
const { Server } = require('socket.io'); 
require('dotenv').config();

const app = express();
// Khởi tạo HTTP Server
const server = http.createServer(app);
// Khởi tạo Socket.io với cấu hình CORS
const io = new Server(server, {
    cors: { origin: "*" } // Cấu hình lại origin cho bảo mật khi deploy
});

// --- 1. CẤU HÌNH VIEW ENGINE (EJS & LAYOUTS) ---
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); // Đảm bảo đường dẫn views chính xác
app.set('layout', 'layouts/main'); // Layout mặc định cho Admin/Super-Admin
app.use(express.static(path.join(__dirname, 'public')));

// --- 2. MIDDLEWARES CƠ BẢN ---
app.use(helmet({ contentSecurityPolicy: false })); // Bảo mật cơ bản
app.use(cors()); // Cho phép truy cập từ client
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// --- 3. CẤU HÌNH SESSION ---
app.use(session({
    secret: process.env.SESSION_SECRET || 'salesphere_secret_key_2024',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        maxAge: 24 * 60 * 60 * 1000, // 1 ngày
        httpOnly: true, // Bảo mật cookie
        secure: process.env.NODE_ENV === 'production' // true nếu dùng HTTPS
    }
}));

// --- 4. MIDDLEWARE TRUYỀN BIẾN TOÀN CỤC CHO GIAO DIỆN ---
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;         // Dành cho Admin/Super-Admin
    res.locals.customer = req.session.customer || null; // Dành cho Người mua
    res.locals.io = io; // Truyền io sang res.locals để sử dụng trong controller
    next();
});

// --- 5. ĐỊNH TUYẾN (ROUTES) ---

// A. Route cho Khách hàng (Người mua - Shop chung)
app.use('/customer', require('./modules/customer/customer.route'));

// B. Route cho Quản trị tối cao (Super Admin)
app.use('/super-admin', require('./modules/super-admin/super-admin.route'));

// C. Route cho Quản trị cửa hàng (Vendor/Admin từng shop)
app.use('/admin', require('./modules/admin/admin.route'));

// --- ĐÃ XÓA: Route chọn vai trò (choose-role) ---

// Chuyển hướng trang chủ đến trang đăng nhập Admin
app.get('/', (req, res) => {
    res.redirect('/admin/login');
});

// E. Health Check API
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', service: 'SaleSphere Multi-Tenant Engine' });
});

// --- 6. XỬ LÝ LỖI (ERROR HANDLER) ---
app.use((req, res, next) => {
    const err = new Error('Không tìm thấy trang');
    err.status = 404;
    next(err);
});

app.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.render('error', {
        layout: false,
        message: err.message,
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

// --- 7. CẤU HÌNH SOCKET.IO ---
io.on('connection', (socket) => {
    console.log('⚡ User connected:', socket.id);
    
    // Ví dụ: Lắng nghe sự kiện thông báo mới
    socket.on('new_order', (data) => {
        io.emit('order_notification', data); // Gửi thông báo đến tất cả admins
    });

    socket.on('disconnect', () => {
        console.log('🔌 User disconnected:', socket.id);
    });
});

// Xuất server thay vì app để sử dụng với socket.io
module.exports = { server, io };