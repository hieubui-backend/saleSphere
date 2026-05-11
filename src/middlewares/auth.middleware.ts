import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

/**
 * 1. XÁC THỰC SESSION (Dành cho Giao diện Web EJS)
 */
export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    if (req.session && req.session.user) {
        return next();
    }
    res.redirect('/admin/auth/login');
};

/**
 * 2. XÁC THỰC JWT (Dành cho API)
 */
export const protect = (req: Request, res: Response, next: NextFunction) => {
    let token: string | undefined;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.session && req.session.user) {
        req.user = req.session.user;
        return next();
    }

    if (!token) {
        res.status(401).json({ 
            success: false, 
            message: 'Bạn chưa đăng nhập! Vui lòng cung cấp token.' 
        });
        return;
    }

    try {
        const secret = process.env.JWT_SECRET || 'salesphere_secret_key';
        const decoded = jwt.verify(token, secret);
        req.user = decoded; 
        next(); 
    } catch (error) {
        res.status(401).json({ 
            success: false, 
            message: 'Token không hợp lệ hoặc đã hết hạn.' 
        });
    }
};

/**
 * 2.5 XÁC THỰC TÙY CHỌN (Dành cho Guest Cart)
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
    let token: string | undefined;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.session && req.session.user) {
        req.user = req.session.user;
        return next();
    }

    if (token) {
        try {
            const secret = process.env.JWT_SECRET || 'salesphere_secret_key';
            const decoded = jwt.verify(token, secret);
            req.user = decoded; 
        } catch (error) {
            // Bỏ qua lỗi token để cho phép Guest đi tiếp
        }
    }
    next();
};

/**
 * 3. KIỂM TRA QUYỀN HẠN (Phân quyền Role)
 */
export const checkRole = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const currentUser = req.user || (req.session ? req.session.user : null);

        if (!currentUser || !roles.includes(currentUser.role)) {
            if (req.originalUrl.startsWith('/api')) {
                res.status(403).json({
                    success: false,
                    message: `Quyền truy cập bị từ chối. Yêu cầu: ${roles.join(' hoặc ')}`
                });
                return;
            }
            res.status(403).render('errors/403', {
                layout: false,
                message: "Bạn không có quyền truy cập khu vực này!"
            });
            return;
        }
        next();
    };
};
