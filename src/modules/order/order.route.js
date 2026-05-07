const express = require('express');
const router = express.Router();
const orderController = require('../../controllers/order.controller');
const { isAuthenticated, checkRole } = require('../../middlewares/auth.middleware');

/**
 * 1. DASHBOARD & DANH SÁCH
 * Controller cần sử dụng req.tenantId (được gán từ middleware auth) để lọc dữ liệu.
 */
router.get('/dashboard', isAuthenticated, orderController.getDashboard);

// Lấy danh sách đơn hàng (Giao diện Admin/Merchant)
router.get('/', isAuthenticated, orderController.getOrders); 

// Chi tiết đơn hàng (Quan trọng: Phải populate tenantId, userId, customerId và items.productId)
router.get('/:id', isAuthenticated, orderController.getOrderById);

/**
 * 2. QUY TRÌNH VẬN ĐƠN (ORDER FLOW)
 * Cho phép admin, super_admin và shop_manager (chủ shop) tham gia xử lý đơn hàng.
 */
// Xác nhận đơn: pending -> processing
router.post('/:id/process', isAuthenticated, checkRole(['admin', 'super_admin', 'shop_manager']), orderController.processOrder);

// Bàn giao vận chuyển: processing -> shipping
router.post('/:id/ship', isAuthenticated, checkRole(['admin', 'super_admin', 'shop_manager']), orderController.shipOrder);

// Hoàn tất đơn hàng: shipping -> completed
router.post('/:id/complete', isAuthenticated, checkRole(['admin', 'super_admin', 'shop_manager']), orderController.completeOrder);

// Hủy đơn hàng (Logic hoàn kho cần được xử lý bên trong controller)
router.post('/:id/cancel', isAuthenticated, orderController.cancelOrder);

/**
 * 3. XỬ LÝ KHIẾU NẠI & TRANH CHẤP
 */
// Shop phản hồi khiếu nại (Chấp nhận hoặc từ chối ban đầu)
router.post('/:id/resolve-dispute', isAuthenticated, checkRole(['admin', 'shop_manager']), orderController.resolveDispute);

// Super Admin đưa ra phán quyết cuối cùng (Trọng tài sàn khi có tranh chấp leo thang)
// Cập nhật: Thêm :id vào route để xác định đơn hàng cần phán quyết
router.post('/:id/admin-verdict', isAuthenticated, checkRole(['super_admin', 'admin']), orderController.adminFinalVerdict);

/**
 * 4. WEBHOOK, TẠO ĐƠN & CẬP NHẬT NHANH
 */
// Nhận tín hiệu từ đối tác giao hàng (Logistics) - Không check Auth vì đối tác gọi vào
router.post('/webhook/logistics', orderController.handleLogisticsWebhook);

// Cập nhật trạng thái nhanh cho giao diện danh sách (AJAX)
router.post('/update-status', isAuthenticated, orderController.updateStatus);

// Tạo đơn hàng mới
router.post('/', isAuthenticated, orderController.createOrder);

module.exports = router;