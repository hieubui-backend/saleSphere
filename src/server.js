const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');
const { applySanitizers } = require('./middlewares/sanitize.middleware');
const { apiLimiter } = require('./middlewares/rateLimiter.middleware');
const path = require('path');
const expressLayouts = require('express-ejs-layouts'); 
const session = require('express-session');
const http = require('http'); 
const { Server } = require('socket.io'); 
require('dotenv').config();
const config = require('./config/config');
const logger = require('./infrastructure/logging/logger');
const errorHandler = require('./middlewares/error.middleware');
const container = require('./di/container');
const morgan = require('morgan');

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
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 

// Áp dụng bộ lọc bảo mật dữ liệu (XSS, NoSQL Injection, HPP)
applySanitizers(app);

// Áp dụng rate limiter chung cho API
app.use('/api', apiLimiter);

// Truyền dữ liệu session sang giao diện (EJS)
app.use((req, res, next) => {
    req.container = container; // Inject Awilix container
    res.locals.user = req.session.user || null;
    res.locals.customer = req.session.customer || null; 
    res.locals.path = req.path;
    res.locals.selectedCategory = req.query.category || 'Tất cả';
    next();
});



// --- 5. ĐỊNH TUYẾN WEBHOOK ---
const orderWebhookRoute = require('./modules/order/order.webhook'); 
app.use('/api/webhook', orderWebhookRoute); 

// --- 6. TÀI LIỆU API ---
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// --- 7. ĐỊNH TUYẾN (ROUTES) ---

// 7.1. TRANG CHỦ (Chuyển hướng đến Store)
app.get('/', (req, res) => {
    res.redirect('/customer/home');
});

// 7.2. AUTH ROUTES (Login/Register Admin)
app.use('/admin/auth', require('./presentation/routes/auth.route'));

// 7.3. ADMIN PANEL (Quản lý)
app.use('/admin', require('./presentation/routes/admin.route')); 

// 7.4. CUSTOMER STORE (Trang bán hàng)
app.use('/customer', require('./presentation/routes/customer.route')); 

// 7.5. API ROUTES
app.use('/api/products', require('./presentation/routes/product.route'));
app.use('/api/orders', require('./presentation/routes/order.route'));
app.use('/api/users', require('./presentation/routes/user.route'));
app.use('/api/payment', require('./presentation/routes/payment.route'));

// Xử lý lỗi 404
app.use((req, res) => {
    res.status(404).render('errors/404', { 
        layout: false,
        title: "404 - Không tìm thấy trang" 
    });
});

// Middleware xử lý lỗi tập trung
app.use(errorHandler);

// --- 8. KẾT NỐI DATABASE & START SERVER ---
const PORT = config.port;
mongoose.connect(config.mongoUri)
    .then(() => {
        logger.info('🎉 Kết nối MongoDB thành công!');
        
        io.on('connection', (socket) => {
            logger.info(`⚡ Kết nối Socket.io thiết lập: ${socket.id}`);
            socket.on('disconnect', () => {
                logger.info('🔌 Một kết nối đã ngắt.');
            });
        });

        server.listen(PORT, () => {
            logger.info(`🚀 Server running in ${config.env} mode`);
            logger.info(`🚀 Portal: http://localhost:${PORT}`);
            logger.info(`🛒 Store: http://localhost:${PORT}/customer/home`);
            logger.info(`🏢 Admin: http://localhost:${PORT}/admin/login`);
        });
    })
    .catch(err => {
        logger.error('❌ Lỗi kết nối MongoDB: %s', err.message);
        process.exit(1);
    });