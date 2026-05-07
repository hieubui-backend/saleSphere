const express = require('express');
const router = express.Router();

// --- IMPORT CONTROLLERS ---
// Controller xử lý logic chính cho từng module
const productController = require('../../presentation/controllers/product.controller');
const authController = require('../../presentation/controllers/auth.controller');
const orderController = require('../../presentation/controllers/order.controller');

// --- IMPORT MIDDLEWARES ---
// Middleware xử lý file upload (sử dụng Multer)
const upload = require('../../middlewares/upload.middleware');
// Middleware xác thực dữ liệu đầu vào
const { validateProduct } = require('../../middlewares/validation.middleware');

/**
 * MIDDLEWARE: Bảo vệ các Route Admin
 * Chức năng:
 * 1. Kiểm tra session/token người dùng.
 * 2. Phân quyền truy cập (chỉ cho phép các vai trò quản trị).
 * 3. Xử lý phản hồi thông minh: Trả về JSON cho API, Redirect cho trình duyệt.
 */
const authWeb = (req, res, next) => {
    // Ưu tiên lấy từ session (Server-side rendering) hoặc req.user (Passport/JWT)
    const user = req.session?.user || req.user;
    
    // Kiểm tra quyền truy cập: Chấp nhận các loại Admin/Shop Manager
    const validRoles = ['admin', 'super-admin', 'super_admin', 'shop_manager', 'shop-manager'];
    const hasAccess = user && validRoles.includes(user.role);

    if (hasAccess) {
        // QUAN TRỌNG: Gán user vào locals để file EJS có thể truy cập <%= user.role %>
        res.locals.user = user;
        return next();
    }

    // Kiểm tra nếu là yêu cầu từ Fetch/AJAX (Header X-Requested-With hoặc Accept JSON)
    const isAjax = req.xhr || (req.headers.accept && req.headers.accept.includes('json'));

    if (isAjax) {
        return res.status(401).json({ 
            success: false, 
            message: 'Phiên làm việc đã hết hạn hoặc bạn không có quyền truy cập.' 
        });
    }

    // Nếu là truy cập trình duyệt thông thường, chuyển hướng về trang login
    res.redirect('/admin/login');
};

// ==========================================
// 1. XÁC THỰC (AUTHENTICATION)
// ==========================================
// Các route này không cần authWeb middleware
router.get('/login', authController.getLoginPage);
router.post('/login', authController.handleLogin);
router.get('/register', authController.getRegisterPage);
router.post('/register', authController.handleRegister);
router.get('/logout', authController.handleLogout);

// ==========================================
// 2. DASHBOARD & THỐNG KÊ
// ==========================================

/**
 * DASHBOARD CỬA HÀNG / TOÀN SÀN
 * Tự động lọc dữ liệu dựa trên tenantId của User trong Controller
 */
router.get('/dashboard', authWeb, orderController.getDashboard);

// ==========================================
// 3. QUẢN LÝ ĐƠN HÀNG (ORDERS)
// ==========================================

/**
 * DANH SÁCH & CHI TIẾT ĐƠN HÀNG
 */
router.get('/orders', authWeb, orderController.getOrders);
router.get('/orders/:id', authWeb, orderController.getOrderById);

/**
 * QUY TRÌNH VẬN ĐƠN (ORDER LIFECYCLE)
 */

// Xác nhận đơn (Ví dụ: Chuyển từ Chờ duyệt sang Đang xử lý)
router.post('/orders/:id/process', authWeb, orderController.processOrder);

// Giao hàng (Chuyển cho đơn vị vận chuyển)
router.post('/orders/:id/ship', authWeb, orderController.shipOrder);

// Hoàn tất (Đơn hàng thành công)
router.post('/orders/:id/complete', authWeb, orderController.completeOrder);

// Hủy đơn (Thực hiện hủy và tự động hoàn kho sản phẩm)
router.post('/orders/:id/cancel', authWeb, orderController.cancelOrder);

/**
 * XỬ LÝ TRANH CHẤP / KHIẾU NẠI (DISPUTE)
 */

// Shop xử lý khiếu nại (Chấp nhận hoàn tiền hoặc Từ chối đẩy lên Sàn)
router.post('/orders/:id/resolve-dispute', authWeb, orderController.resolveDispute);

// Admin Sàn thực thi phán quyết cuối cùng (Dành riêng cho Super Admin - Cần thêm middleware check role)
router.post('/orders/:id/admin-verdict', authWeb, orderController.adminFinalVerdict);

/**
 * CẬP NHẬT TRẠNG THÁI NHANH
 */
router.post('/update-order-status', authWeb, orderController.updateStatus);

// ==========================================
// 4. QUẢN LÝ SẢN PHẨM (PRODUCTS)
// ==========================================

/**
 * TRUY VẤN SẢN PHẨM
 */
router.get('/products', authWeb, productController.getProducts);

/**
 * TẠO MỚI SẢN PHẨM (Hỗ trợ upload tối đa 5 ảnh)
 */
router.get('/products/create', authWeb, productController.getCreateProductPage);
router.post('/products/create', 
    authWeb, 
    upload.array('images', 5), // Middleware xử lý upload ảnh
    validateProduct,           // Middleware validate dữ liệu
    productController.createProduct
);

/**
 * CHỈNH SỬA SẢN PHẨM
 */
router.get('/products/edit/:id', authWeb, productController.getProductById);
router.post('/products/edit/:id', 
    authWeb, 
    upload.array('images', 5), 
    validateProduct, 
    productController.updateProduct
);

/**
 * XÓA SẢN PHẨM
 */
// Route chuẩn RESTful (Dùng cho Fetch API)
router.delete('/products/:id', authWeb, productController.deleteProduct);

// Route Fallback (Dùng cho thẻ <a> hoặc trình duyệt cũ)
router.get('/products/delete/:id', authWeb, productController.deleteProduct);

module.exports = router;