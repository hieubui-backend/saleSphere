const express = require('express');
const router = express.Router();
const { isAuthenticated, checkRole } = require('../../middlewares/auth.middleware');
const tenantController = require('../../presentation/controllers/tenant.controller');
const orderController = require('../../presentation/controllers/order.controller');

// ==========================================
// 1. DASHBOARD - TỔNG HỢP TOÀN SÀN
// ==========================================
router.get('/dashboard', isAuthenticated, checkRole('super_admin'), orderController.getDashboard);

// ==========================================
// 2. QUẢN LÝ TRANH CHẤP & PHÁN QUYẾT
// ==========================================

// Route xử lý tranh chấp cuối cùng
router.post('/orders/:id/resolve-dispute-final', isAuthenticated, checkRole('super_admin'), orderController.adminFinalVerdict);

// Route dọn rác đơn hàng (Giữ nguyên logic cũ nhưng dùng model từ infrastructure)
router.get('/clean-database', isAuthenticated, checkRole('super_admin'), async (req, res) => {
    try {
        const Order = require('../../infrastructure/database/models/order.model');
        const result = await Order.deleteMany({ 
            $or: [
                { tenantId: { $exists: false } },
                { tenantId: null }
            ] 
        });
        res.send(`Thành công: Đã xóa ${result.deletedCount} đơn hàng không hợp lệ.`);
    } catch (error) {
        res.status(500).send("Lỗi dọn dẹp: " + error.message);
    }
});

// ==========================================
// 3. QUẢN LÝ CỬA HÀNG (TENANTS)
// ==========================================

// A. Danh sách tất cả Shop (Sử dụng controller đã refactor)
router.get('/tenants', isAuthenticated, checkRole('super_admin'), async (req, res) => {
    try {
        const { tenantUseCases } = req.container.cradle;
        const tenants = await tenantUseCases.getAllTenants({ status: { $ne: 'pending' } });
        res.render('super-admin/tenants-list', { 
            layout: 'layouts/main',
            title: 'Quản trị Cửa hàng',
            tenants: tenants || [],
            user: req.session.user,
            userName: req.session.user?.name 
        });
    } catch (error) {
        res.status(500).send("Lỗi tải danh sách cửa hàng: " + error.message);
    }
});

// B. DANH SÁCH SHOP CHỜ PHÊ DUYỆT
router.get('/tenants/pending', isAuthenticated, checkRole('super_admin'), async (req, res) => {
    try {
        const { tenantUseCases } = req.container.cradle;
        const pendingTenants = await tenantUseCases.getAllTenants({ status: 'pending' });
        res.render('super-admin/tenants-pending', {
            layout: 'layouts/main',
            title: 'Phê duyệt Cửa hàng mới',
            tenants: pendingTenants || [],
            user: req.session.user,
            userName: req.session.user?.name
        });
    } catch (error) {
        res.status(500).send("Lỗi tải danh sách chờ phê duyệt: " + error.message);
    }
});

// C. THỰC HIỆN PHÊ DUYỆT / KHÓA / MỞ KHÓA (Dùng UseCase tập trung)
router.get('/tenants/approve/:id', isAuthenticated, checkRole('super_admin'), async (req, res) => {
    try {
        const { tenantUseCases } = req.container.cradle;
        await tenantUseCases.toggleTenantStatus(req.params.id, true);
        res.redirect('/super-admin/tenants/pending'); 
    } catch (error) {
        res.status(500).send("Lỗi phê duyệt: " + error.message);
    }
});

router.get('/tenants/toggle/:id', isAuthenticated, checkRole('super_admin'), async (req, res) => {
    try {
        const { tenantUseCases } = req.container.cradle;
        await tenantUseCases.toggleTenantStatus(req.params.id);
        res.redirect('/super-admin/tenants'); 
    } catch (error) {
        res.status(500).send("Lỗi khi thay đổi trạng thái: " + error.message);
    }
});

// Sửa cửa hàng (API)
router.put('/tenants/:id', isAuthenticated, checkRole('super_admin'), tenantController.updateTenant);

// Xóa cửa hàng (API)
router.delete('/tenants/:id', isAuthenticated, checkRole('super_admin'), tenantController.deleteTenant);

// Thêm cửa hàng mới
router.post('/tenants', isAuthenticated, checkRole('super_admin'), tenantController.createTenant);

// ==========================================
// 4. QUẢN LÝ NGƯỜI MUA (CUSTOMERS)
// ==========================================
router.get('/customers', isAuthenticated, checkRole('super_admin'), async (req, res) => {
    try {
        const { customerUseCases } = req.container.cradle;
        const customers = await customerUseCases.getAllCustomers();
        res.render('super-admin/customers-list', {
            layout: 'layouts/main',
            title: 'Quản trị Người dùng',
            customers: customers || [],
            user: req.session.user,
            userName: req.session.user?.name
        });
    } catch (error) {
        res.status(500).send("Lỗi tải danh sách người dùng: " + error.message);
    }
});

module.exports = router;