const jwt = require('jsonwebtoken');

/**
 * 1. XÁC THỰC SESSION (Dành cho Giao diện Web EJS)
 * Kiểm tra xem người dùng đã đăng nhập qua Form chưa
 */
exports.isAuthenticated = (req, res, next) => {
    if (req.session && req.session.user) {
        // Nếu là Seller, kiểm tra xem tài khoản đã được phê duyệt chưa
        if (req.session.user.role === 'seller' || req.session.tenant) {
            const tenant = req.session.tenant || req.session.user; 
            
            // Nếu tài khoản chưa được kích hoạt (isActive: false)
            if (tenant.isActive === false) {
                return res.render('seller/waiting-approval', {
                    layout: false,
                    message: "Tài khoản của bạn đang chờ Super Admin phê duyệt. Vui lòng quay lại sau!"
                });
            }
        }
        return next();
    }
    // Nếu chưa đăng nhập, bắt quay về trang login của admin/seller tùy context
    const redirectUrl = req.originalUrl.includes('super-admin') ? '/admin/login' : '/seller/login';
    res.redirect(redirectUrl);
};

/**
 * 2. XÁC THỰC JWT (Dành cho API)
 */
exports.protect = (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'Bạn chưa đăng nhập! Vui lòng cung cấp token.' 
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'salesphere_secret_key');
        req.user = decoded; 

        // Kiểm tra trạng thái phê duyệt cho API nếu là Seller
        if (req.user.role === 'seller' && req.user.isActive === false) {
            return res.status(403).json({
                success: false,
                message: 'Tài khoản của bạn chưa được phê duyệt bởi Super Admin.'
            });
        }

        next(); 
    } catch (error) {
        return res.status(401).json({ 
            success: false, 
            message: 'Token không hợp lệ hoặc đã hết hạn.' 
        });
    }
};

/**
 * 3. KIỂM TRA QUYỀN HẠN (Phân quyền Role)
 */
exports.checkRole = (...roles) => {
    return (req, res, next) => {
        const currentUser = req.user || (req.session ? req.session.user : null);

        if (!currentUser || !roles.includes(currentUser.role)) {
            if (req.originalUrl.startsWith('/api')) {
                return res.status(403).json({
                    success: false,
                    message: `Quyền truy cập bị từ chối. Yêu cầu: ${roles.join(' hoặc ')}`
                });
            }
            return res.status(403).render('error', {
                layout: false,
                message: "Bạn không có quyền truy cập khu vực này!"
            });
        }
        next();
    };
};

/**
 * 4. MIDDLEWARE BỔ SUNG: KIỂM TRA TRẠNG THÁI TENANT (Chuyên biệt)
 * Dùng cho các route seller cần check nhanh trạng thái shop
 */
exports.isAccountApproved = async (req, res, next) => {
    const Tenant = require('../infrastructure/database/models/tenant.model');
    const tenantId = req.session?.tenant?._id || req.user?.tenantId;

    if (!tenantId) return next();

    try {
        const tenant = await Tenant.findById(tenantId);
        if (tenant && (tenant.status === 'pending' || !tenant.isActive)) {
            if (req.originalUrl.startsWith('/api')) {
                return res.status(403).json({ success: false, message: "Tài khoản chờ phê duyệt." });
            }
            return res.render('seller/waiting-approval', { layout: false });
        }
        next();
    } catch (err) {
        next(err);
    }
};