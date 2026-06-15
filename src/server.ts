/// <reference path="./types/express.d.ts" />
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import swaggerSpecs from './config/swagger';
import { applySanitizers } from './middlewares/sanitize.middleware';
import { apiLimiter } from './middlewares/rateLimiter.middleware';
import path from 'path';
import session from 'express-session';
import http from 'http'; 
import { Server as SocketServer } from 'socket.io'; 
import dotenv from 'dotenv';
import config from './config/config';
import logger from './infrastructure/logging/logger';
import errorHandler from './middlewares/error.middleware';
import container from './di/container';
import morgan from 'morgan';

dotenv.config();

const app = express();
const server = http.createServer(app); 
const io = new SocketServer(server, {
    cors: { origin: "*" }
});

// Lưu đối tượng io vào app để sử dụng trong các controller/service khác
app.set('socketio', io);

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
app.use(cors({
    origin: config.corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan('combined', { stream: { write: (message: string) => logger.info(message.trim()) } }));
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 

// Áp dụng bộ lọc bảo mật dữ liệu (XSS, NoSQL Injection, HPP)
applySanitizers(app);

// Áp dụng rate limiter chung cho API
app.use('/api', apiLimiter);

// Truyền dữ liệu session sang giao diện (EJS)
app.use((req, res, next) => {
    (req as any).container = container; // Inject Awilix container
    res.locals.user = req.session.user || null;
    res.locals.customer = req.session.customer || null; 
    res.locals.path = req.path;
    res.locals.selectedCategory = req.query.category || 'Tất cả';
    next();
});

// --- 5. ĐỊNH TUYẾN WEBHOOK (Tạm thời comment nếu file không tồn tại) ---
// import orderWebhookRoute from './modules/order/order.webhook'; 
// app.use('/api/webhook', orderWebhookRoute); 

// --- 6. TÀI LIỆU API ---
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// --- 7. ĐỊNH TUYẾN (ROUTES) ---
import authRoutes from './presentation/routes/auth.route';
import adminRoutes from './presentation/routes/admin.route';
import customerRoutes from './presentation/routes/customer.route';
import productRoutes from './presentation/routes/product.route';
import orderRoutes from './presentation/routes/order.route';
import userRoutes from './presentation/routes/user.route';
import paymentRoutes from './presentation/routes/payment.route';

// 7.1. HEALTH CHECK - phải đặt TRƯỚC mongoose.connect() để K8s probe hoạt động
let isMongoConnected = false;

app.get('/', (req, res) => {
    res.json({ success: true, message: 'SaleSphere API is running' });
});

// Endpoint /health cho Kubernetes readiness/liveness probe
app.get('/health', (req, res) => {
    if (isMongoConnected) {
        res.status(200).json({ status: 'ok', db: 'connected' });
    } else {
        // Trả 200 cho liveness (app không chết) nhưng 503 cho readiness (chưa sẵn sàng)
        res.status(503).json({ status: 'starting', db: 'connecting' });
    }
});

// 7.2. AUTH ROUTES (Admin/Staff)
app.use('/api/auth', authRoutes);

// 7.3. ADMIN MANAGEMENT API
app.use('/api/admin', adminRoutes);

// 7.4. CUSTOMER API
app.use('/api/customer', customerRoutes);

// 7.5. PUBLIC & SHARED API ROUTES
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payment', paymentRoutes);

// Xử lý lỗi 404
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài nguyên yêu cầu (404)'
    });
});

// Middleware xử lý lỗi tập trung
app.use(errorHandler);

// --- 8. KHỜi ĐỘNG SERVER TRƯỚC, SAU ĐÓ MỚI KẾT NỐI DB ---
// (Quan trọng: để K8s readinessProbe tiếp cận được app ngay từ đầu)
const PORT = config.port;
server.listen(PORT, () => {
    logger.info(`🚀 Server running in ${config.env} mode on port ${PORT}`);
    logger.info(`🚀 API Base: http://localhost:${PORT}/api`);
    logger.info(`📄 API Docs: http://localhost:${PORT}/api-docs`);
});

mongodb_connect();

async function mongodb_connect() {
    try {
        await mongoose.connect(config.mongoUri);
        isMongoConnected = true;
        logger.info('🎉 Kết nối MongoDB thành công!');

        io.on('connection', (socket) => {
            logger.info(`⚡ Kết nối Socket.io thiết lập: ${socket.id}`);
            socket.on('disconnect', () => {
                logger.info('🔌 Một kết nối đã ngắt.');
            });
        });

        // --- 9. KHỜi ĐỘNG WORKERS (BACKGROUND JOBS) ---
        container.resolve('emailWorker');
        logger.info('⚙️  Email Worker has been initialized.');

    } catch (err: any) {
        isMongoConnected = false;
        logger.error('❌ Lỗi kết nối MongoDB: %s', err.message);
        // Không gọi process.exit(1) nữa — để K8s readiness probe tự xử lý
        // K8s sẽ restart pod sau nhiều lần readiness fail liên tiếp
        logger.error('⚠️  Server khởi động nhưng chưa kết nối được MongoDB. Readiness probe sẽ tự động re-check.');
    }
}

// --- 10. GRACEFUL SHUTDOWN ---
const gracefulShutdown = async () => {
    logger.info('🛑 Shutting down gracefully...');
    try {
        const emailWorker = container.resolve('emailWorker') as any;
        const emailQueue = container.resolve('emailQueue') as any;
        
        await emailWorker.close();
        await emailQueue.close();
        
        await mongoose.connection.close();
        server.close(() => {
            logger.info('👋 Server closed.');
            process.exit(0);
        });
    } catch (error: any) {
        logger.error('❌ Error during shutdown: %s', error.message);
        process.exit(1);
    }
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);






