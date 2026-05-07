const express = require('express');
const router = express.Router();

// --- IMPORT MIDDLEWARES ---
const { isAuthenticated, checkRole } = require('../../middlewares/auth.middleware');

// API: Sửa cửa hàng
router.put('/tenants/:id', isAuthenticated, checkRole('super_admin'), async (req, res) => {
    try {
        const { name, shopName, email, slug } = req.body;
        const tenant = await Tenant.findByIdAndUpdate(req.params.id, { name, shopName, email, slug }, { new: true });
        if (!tenant) return res.status(404).json({ success: false, message: 'Không tìm thấy cửa hàng!' });
        res.json({ success: true, tenant });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// API: Xóa cửa hàng
router.delete('/tenants/:id', isAuthenticated, checkRole('super_admin'), async (req, res) => {
    try {
        const tenant = await Tenant.findByIdAndDelete(req.params.id);
        if (!tenant) return res.status(404).json({ success: false, message: 'Không tìm thấy cửa hàng!' });
        res.json({ success: true, message: 'Đã xóa cửa hàng.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// API: Khóa/Mở khóa cửa hàng
router.patch('/tenants/:id/toggle', isAuthenticated, checkRole('super_admin'), async (req, res) => {
    try {
        const { isActive } = req.body;
        const tenant = await Tenant.findById(req.params.id);
        if (!tenant) return res.status(404).json({ success: false, message: 'Không tìm thấy cửa hàng!' });
        tenant.isActive = !!isActive;
        tenant.status = isActive ? 'active' : 'blocked';
        await tenant.save();

        // Ẩn hoặc hiện tất cả sản phẩm của shop này
        const Product = require('../../infrastructure/database/models/product.model');
        await Product.updateMany(
            { tenantId: tenant._id },
            { $set: { isActive: !!isActive } }
        );

        res.json({ success: true, message: isActive ? 'Đã mở khóa cửa hàng.' : 'Đã khóa cửa hàng và ẩn toàn bộ sản phẩm.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
const mongoose = require('mongoose');

// --- IMPORT MODELS ---
const Tenant = require('../../infrastructure/database/models/tenant.model');
const Customer = require('../customer/customer.model'); 
const Order = require('../order/order.model');
const Product = require('../../infrastructure/database/models/product.model');

// --- IMPORT SERVICES ---
const orderService = require('../../services/order.service');



/**
 * HELPER: PHÁT TÍN HIỆU REALTIME
 */
const emitUpdate = (req, tenantId, data) => {
    const io = req.app.get('socketio');
    if (io) {
        const tId = tenantId?._id || tenantId;
        io.emit(`orderUpdate_${tId}`, { ...data });
        io.emit('orderUpdate', { ...data, tenantId: tId });
        io.emit('statsUpdate', { tenantId: tId });
    }
};

// ==========================================
// 1. DASHBOARD - TỔNG HỢP TOÀN SÀN
// ==========================================
router.get('/dashboard', isAuthenticated, checkRole('super_admin'), async (req, res) => {
    try {
        const user = req.session?.user;
        const { range = '7days', start, end } = req.query;

        let startDate = new Date();
        startDate.setHours(0, 0, 0, 0);

        if (range === '7days') {
            startDate.setDate(startDate.getDate() - 7);
        } else if (range === '30days') {
            startDate.setDate(startDate.getDate() - 30);
        } else if (range === 'custom' && start) {
            startDate = new Date(start);
        } else if (range === 'today') {
            startDate.setHours(0, 0, 0, 0);
        }

        const statsData = await orderService.getDashboardStats(null, { range, start, end });
        
        const urgentDisputes = await Order.find({ 
            status: { $in: ['dispute_escalated', 'waiting_approval', 'failed', 'returning'] } 
        })
        .populate('tenantId', 'shopName')
        .populate('userId', 'name email') 
        .sort({ updatedAt: -1 })
        .limit(10)
        .lean();

        const topTenantsRaw = await Order.aggregate([
            { 
                $match: { 
                    status: 'completed',
                    createdAt: { $gte: startDate }
                } 
            },
            {
                $group: {
                    _id: "$tenantId",
                    orderCount: { $sum: 1 },
                    revenue: { $sum: "$totalAmount" }
                }
            },
            { $sort: { revenue: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: "tenants", 
                    localField: "_id",
                    foreignField: "_id",
                    as: "details"
                }
            },
            { $unwind: "$details" }
        ]);

        const [totalTenants, totalCustomers] = await Promise.all([
            Tenant.countDocuments(),
            Customer.countDocuments()
        ]);

        const safeStats = {
            tenants: totalTenants || 0,
            customers: totalCustomers || 0,
            totalOrders: statsData?.summary?.orders || 0,
            totalRevenue: statsData?.summary?.revenue || 0,
            shipping: statsData?.summary?.shipping || 0,
            completedToday: statsData?.summary?.completedToday || 0,
            cancelled: statsData?.summary?.cancelled || 0,
            failed: statsData?.summary?.failed || 0,
            returned: statsData?.summary?.returned || 0,
            chartLabels: statsData?.chart?.labels || [],
            chartValues: statsData?.chart?.values || [],
            topTenants: topTenantsRaw.map(t => ({
                name: t.details.shopName || t.details.name || 'Cửa hàng không tên',
                orderCount: t.orderCount,
                revenue: t.revenue,
                returnRate: 0 
            })),
            actionRequired: (urgentDisputes || []).map(d => ({
                ...d,
                shopName: d.tenantId?.shopName || 'N/A',
                customerName: d.userId?.name || 'Khách hàng',
                disputeReason: d.disputeReason || (d.dispute ? d.dispute.reason : 'Khiếu nại chưa rõ lý do')
            }))
        };

        res.render('super-admin/dashboard', {
            layout: 'layouts/main',
            title: 'Hệ thống Quản trị Toàn sàn',
            user: user,
            userName: user?.name || 'Super Admin',
            stats: safeStats,
            filters: { range, start, end }
        });

    } catch (error) {
        res.status(500).send(`Lỗi hệ thống: ${error.message}`);
    }
});

// ==========================================
// 2. QUẢN LÝ TRANH CHẤP & PHÁN QUYẾT
// ==========================================

router.post('/orders/:orderId/resolve-dispute-final', isAuthenticated, checkRole('super_admin'), async (req, res) => {
    try {
        const { orderId } = req.params;
        let { verdict, adminNote } = req.body; 

        if (!orderId || !verdict) {
            return res.status(400).json({ success: false, message: "Thiếu thông tin phán quyết" });
        }

        const v = String(verdict).trim().toUpperCase();
        let finalVerdict = "";
        let statusMessage = "";

        if (['PAY_SHOP', 'REJECTED', 'DENY', 'REJECT', 'TRẢ TIỀN SHOP'].includes(v)) {
            finalVerdict = 'PAY_SHOP';
            statusMessage = "Admin đã bác bỏ khiếu nại. Thanh toán được chuyển cho Cửa hàng.";
        } else if (['REFUND_CUSTOMER', 'APPROVED', 'ACCEPT', 'HOÀN TIỀN KHÁCH'].includes(v)) {
            finalVerdict = 'REFUND_CUSTOMER';
            statusMessage = "Admin đã chấp nhận khiếu nại. Tiền sẽ được hoàn lại cho Khách hàng.";
        } else {
            return res.status(400).json({ success: false, message: `Phán quyết '${verdict}' không hợp lệ` });
        }

        const order = await orderService.resolveDisputeFinal(orderId, { 
            verdict: finalVerdict, 
            adminNote: adminNote || statusMessage
        });

        if (!order) throw new Error("Không tìm thấy đơn hàng.");

        emitUpdate(req, order.tenantId, { 
            orderId, 
            status: order.status,
            message: statusMessage,
            finalVerdict: finalVerdict
        });

        res.json({ 
            success: true, 
            message: "Đã thực thi phán quyết thành công.",
            data: { orderId: order._id, status: order.status, verdict: finalVerdict }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

const tenantController = require('../../presentation/controllers/tenant.controller');
const authController = require('../../presentation/controllers/auth.controller');

// ==========================================
// 3. QUẢN LÝ CỬA HÀNG (TENANTS)
// ==========================================

// A. Danh sách tất cả Shop (Đã duyệt & Bị khóa)
router.get('/tenants', isAuthenticated, checkRole('super_admin'), async (req, res) => {
    try {
        const tenants = await Tenant.find({ status: { $ne: 'pending' } }).sort({ createdAt: -1 }).lean();
        res.render('super-admin/tenants-list', { 
            layout: 'layouts/main',
            title: 'Quản trị Cửa hàng',
            tenants: tenants || [],
            user: req.session.user,
            userName: req.session.user?.name 
        });
    } catch (error) {
        res.status(500).send("Lỗi tải danh sách cửa hàng");
    }
});

// Thêm cửa hàng mới (xử lý form từ tenants-list.ejs)
router.post('/tenants', isAuthenticated, checkRole('super_admin'), tenantController.createTenant);


// B. DANH SÁCH SHOP CHỜ PHÊ DUYỆT (MỚI)
router.get('/tenants/pending', isAuthenticated, checkRole('super_admin'), async (req, res) => {
    try {
        const pendingTenants = await Tenant.find({ status: 'pending' }).sort({ createdAt: -1 }).lean();
        res.render('super-admin/tenants-pending', {
            layout: 'layouts/main',
            title: 'Phê duyệt Cửa hàng mới',
            tenants: pendingTenants || [],
            user: req.session.user,
            userName: req.session.user?.name
        });
    } catch (error) {
        res.status(500).send("Lỗi tải danh sách chờ phê duyệt");
    }
});

// C. THỰC HIỆN PHÊ DUYỆT (MỚI)
router.get('/tenants/approve/:id', isAuthenticated, checkRole('super_admin'), async (req, res) => {
    try {
        const tenant = await Tenant.findById(req.params.id);
        if (!tenant) return res.status(404).send("Không tìm thấy cửa hàng");

        tenant.isActive = true;
        tenant.status = 'active';
        await tenant.save();

        res.redirect('/super-admin/tenants/pending'); 
    } catch (error) {
        res.status(500).send("Lỗi phê duyệt: " + error.message);
    }
});

// D. KHÓA / MỞ KHÓA THẺ
router.get('/tenants/toggle/:id', isAuthenticated, checkRole('super_admin'), async (req, res) => {
    try {
        const tenant = await Tenant.findById(req.params.id);
        if (!tenant) return res.status(404).send("Không tìm thấy cửa hàng");

        tenant.isActive = !tenant.isActive;
        // Cập nhật status tương ứng để dễ quản lý
        tenant.status = tenant.isActive ? 'active' : 'blocked';
        await tenant.save();

        res.redirect('/super-admin/tenants'); 
    } catch (error) {
        res.status(500).send("Lỗi khi thay đổi trạng thái: " + error.message);
    }
});

// ==========================================
// 4. QUẢN LÝ NGƯỜI MUA & DỮ LIỆU
// ==========================================

router.get('/customers', isAuthenticated, checkRole('super_admin'), async (req, res) => {
    try {
        const customers = await Customer.find().sort({ createdAt: -1 }).lean();
        res.render('super-admin/customers-list', {
            layout: 'layouts/main',
            title: 'Quản trị Người dùng',
            customers: customers || [],
            user: req.session.user,
            userName: req.session.user?.name
        });
    } catch (error) {
        res.status(500).send("Lỗi tải danh sách người dùng");
    }
});

// ROUTE DỌN RÁC ĐƠN HÀNG (TEST POSTMAN)
router.get('/clean-database', isAuthenticated, checkRole('super_admin'), async (req, res) => {
    try {
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

module.exports = router;