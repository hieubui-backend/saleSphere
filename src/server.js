const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');
const path = require('path');
const expressLayouts = require('express-ejs-layouts'); 
const session = require('express-session');
const http = require('http'); 
const { Server } = require('socket.io'); 
require('dotenv').config();
const errorHandler = require('./middlewares/error.middleware');
const container = require('./di/container');

const app = express();
const server = http.createServer(app); 
const io = new Server(server, {
    cors: { origin: "*" }
});

// Lưu đối tượng io vào app để sử dụng trong các controller/service khác
app.set('socketio', io);

// --- 1. CẤU HÌNH GIAO DIỆN (EJS & LAYOUTS) ---
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); 
app.set('layout', 'layouts/main'); 

// --- 2. CẤU HÌNH THƯ MỤC TĨNH (STATIC) ---
app.use(express.static(path.join(__dirname, '../public'))); 
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));
app.use('/images', express.static(path.join(__dirname, '../public/images')));

// --- 3. CẤU HÌNH SESSION ---
app.use(session({
    secret: process.env.SESSION_SECRET || 'salesphere_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        maxAge: 24 * 60 * 60 * 1000, 
        secure: false, // Để true nếu sử dụng HTTPS
        httpOnly: true,
        sameSite: 'lax'
    }
}));

// --- 4. MIDDLEWARES CƠ BẢN ---
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 

// Truyền dữ liệu session sang giao diện (EJS)
app.use((req, res, next) => {
    req.container = container; // Inject Awilix container
    res.locals.user = req.session.user || null;
    res.locals.customer = req.session.customer || null; 
    res.locals.path = req.path;
    res.locals.selectedCategory = req.query.category || 'Tất cả';
    next();
});

// Giới hạn số lượng request
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { message: 'Quá nhiều yêu cầu, vui lòng thử lại sau.' }
});

// --- 5. ĐỊNH TUYẾN WEBHOOK ---
const orderWebhookRoute = require('./modules/order/order.webhook'); 
app.use('/api/webhook', orderWebhookRoute); 

// --- 6. TÀI LIỆU API ---
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// --- 7. ĐỊNH TUYẾN (ROUTES) ---

// 7.1. TRANG PORTAL (Lựa chọn vai trò ngay khi vào web)
app.get('/', (req, res) => {
    // Render trang portal không dùng layout chung
    res.render('portal', { layout: false, title: "SaleSphere - Chọn vai trò" });
});

// 7.2. Định tuyến cho Quản trị viên của từng Shop (Dùng cho bên trong admin panel)
app.use('/admin', require('./modules/admin/admin.route')); 

// 7.3. Định tuyến cho Khách hàng
app.use('/customer', require('./modules/customer/customer.route')); 

// 7.4. Định tuyến cho Người bán (Tenant)
app.use('/tenant', require('./modules/tenant/tenant.route')); 

// 7.5. Định tuyến cho Super Admin (Quản trị hệ thống)
app.use('/super-admin', require('./modules/super-admin/super-admin.route')); 

// API Routes
app.get('/api', (req, res) => res.status(200).json({ message: 'API ROOT OK' }));
app.use('/api/orders', limiter, require('./modules/order/order.route'));
app.use('/api/users', require('./presentation/routes/user.route'));

// Xử lý lỗi 404 - SỬA LẠI ĐƯỜNG DẪN RENDER
app.use((req, res) => {
    res.status(404).render('errors/404', { 
        layout: false,
        title: "404 - Không tìm thấy trang" 
    });
});

// Middleware xử lý lỗi tập trung
app.use(errorHandler);

// --- 8. KẾT NỐI DATABASE & START SERVER ---
const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('🎉 Kết nối MongoDB thành công!');
        
        io.on('connection', (socket) => {
            console.log('⚡ Kết nối Socket.io thiết lập');
            socket.on('disconnect', () => {
                console.log('🔌 Một kết nối đã ngắt.');
            });
        });

        server.listen(PORT, () => {
            console.log(`🚀 Portal: http://localhost:${PORT}`);
            console.log(`🛒 Store: http://localhost:${PORT}/customer/home`);
            console.log(`🏢 Admin: http://localhost:${PORT}/admin/login`);
        });
    })
    .catch(err => {
        console.error('❌ Lỗi kết nối MongoDB:', err.message);
    });