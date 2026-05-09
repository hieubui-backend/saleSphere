import rateLimit from 'express-rate-limit';

// Rate limit chung cho API
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: 100, // Mỗi IP 100 req
    message: { success: false, message: 'Quá nhiều yêu cầu, vui lòng thử lại sau 15 phút.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limit chặt cho Auth
export const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 giờ
    max: 10, // Mỗi IP 10 req
    message: { success: false, message: 'Thử lại quá nhiều lần, vui lòng thử lại sau 1 giờ.' },
    standardHeaders: true,
    legacyHeaders: false,
});





