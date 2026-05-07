const asyncHandler = require('express-async-handler');
const orderService = require('../services/order.service');
const Tenant = require('../modules/tenant/tenant.model');
const Product = require('../infrastructure/database/models/product.model');
const Order = require('../modules/order/order.model');
const User = require('../infrastructure/database/models/user.model');
const mongoose = require('mongoose');

/**
 * HELPER: CỘNG LẠI KHO (RESTOCK) khi hủy hoặc hoàn trả
 */
const restockProducts = async (order) => {
    if (!order || !order.items || order.items.length === 0) return;
    try {
        const updatePromises = order.items.map(item => {
            const pId = item.product || item.productId;
            if (pId) {
                return Product.findByIdAndUpdate(pId, {
                    $inc: { stock: item.quantity }
                });
            }
        });
        await Promise.all(updatePromises);
    } catch (error) {
        console.error("Lỗi hoàn kho:", error);
    }
};

/**
 * HELPER: PHÁT TÍN HIỆU REALTIME QUA SOCKET.IO
 */
const emitOrderUpdate = (req, tenantId, data) => {
    const io = req.app.get('socketio');
    if (io) {
        io.emit('orderUpdate', { ...data, tenantId });
        io.emit('statsUpdate', { tenantId });
        
        const urgentStatuses = ['dispute_escalated', 'waiting_approval', 'return_requested'];
        if (urgentStatuses.includes(data.status)) {
            io.emit('newDisputeAlert', {
                message: `Cần xử lý đơn hàng #${data.orderId.toString().slice(-6).toUpperCase()}`,
                ...data
            });
        }
    }
};

// ==========================================
// 1. QUẢN LÝ TẠO ĐƠN & WEBHOOK
// ==========================================

exports.createOrder = asyncHandler(async (req, res) => {
    const user = req.session?.user || req.user;
    const tenantId = user?.tenantId;
    
    const order = await orderService.createOrder(tenantId, user?.id || user?._id, req.body);
    
    const io = req.app.get('socketio');
    if (io) io.emit('newOrder', { tenantId, orderId: order._id });

    res.status(201).json({ success: true, data: order });
});

exports.handleLogisticsWebhook = asyncHandler(async (req, res) => {
    const { order_id, status, partner, reason } = req.body;
    
    const order = await Order.findById(order_id);
    if (!order) return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });

    const statusMap = {
        'delivering': 'shipping',
        'delivered': 'completed',
        'failed': 'failed',
        'returned': 'returned'
    };
    
    const finalStatus = statusMap[status.toLowerCase()] || status.toLowerCase();

    await orderService.updateOrderStatus(order_id, order.tenantId, finalStatus);

    if (['returned', 'cancelled', 'failed'].includes(finalStatus)) {
        await restockProducts(order);
    }

    emitOrderUpdate(req, order.tenantId, { 
        orderId: order_id, 
        status: finalStatus, 
        message: `Logistics (${partner || 'Đơn vị vận chuyển'}): ${status}`,
        reason: reason || ''
    });

    res.status(200).json({ success: true, message: "Webhook processed" });
});

// ==========================================
// 2. HIỂN THỊ DASHBOARD & DANH SÁCH
// ==========================================

exports.getDashboard = asyncHandler(async (req, res) => {
    const user = req.session?.user || req.user;
    const isSuperAdmin = ['super-admin', 'super_admin'].includes(user?.role);
    const tenantId = isSuperAdmin ? null : user?.tenantId;

    const filter = tenantId ? { tenantId } : {};

    const urgentDisputes = await Order.find({
        ...filter,
        status: 'dispute_escalated'
    })
    .populate('tenantId', 'name')
    .sort({ updatedAt: -1 })
    .lean();

    const [totalProducts, allOrders, allTenants] = await Promise.all([
        Product.countDocuments(filter),
        Order.find(filter).lean(),
        Tenant.find().lean()
    ]);

    let topStores = [];
    if (isSuperAdmin) {
        const storeStats = allOrders.reduce((acc, order) => {
            const tId = order.tenantId?.toString();
            if (!tId) return acc;
            
            if (!acc[tId]) {
                acc[tId] = { orderCount: 0, revenue: 0, completedCount: 0 };
            }
            
            acc[tId].orderCount += 1;
            if (order.status === 'completed') {
                acc[tId].revenue += (order.totalAmount || 0);
                acc[tId].completedCount += 1;
            }
            return acc;
        }, {});

        topStores = allTenants.map(t => {
            const stats = storeStats[t._id.toString()] || { orderCount: 0, revenue: 0, completedCount: 0 };
            return {
                _id: t._id,
                name: t.name,
                orderCount: stats.orderCount,
                revenue: stats.revenue,
                satisfaction: stats.orderCount > 0 ? 100 : 0 
            };
        })
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);
    }

    const totalRevenue = allOrders
        .filter(order => order.status === 'completed')
        .reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    const stats = {
        totalProducts,
        totalOrders: allOrders.length,
        totalRevenue: totalRevenue,
        shipping: allOrders.filter(o => o.status === 'shipping').length,
        completed: allOrders.filter(o => o.status === 'completed').length,
        cancelled: allOrders.filter(o => o.status === 'cancelled').length,
        failed: allOrders.filter(o => o.status === 'failed').length,
        returned: allOrders.filter(o => o.status === 'returned').length
    };

    const latestOrders = await Order.find(filter)
        .populate('userId', 'name')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();

    const latestTenants = isSuperAdmin 
        ? allTenants.sort((a, b) => b.createdAt - a.createdAt).slice(0, 5)
        : [];

    if (req.accepts('html')) {
        return res.render('dashboard', { 
            layout: 'layouts/main',
            title: isSuperAdmin ? 'Hệ thống Quản trị Toàn sàn' : 'Báo cáo Cửa hàng',
            user,
            userName: user.name || 'Admin', 
            stats: stats,
            chart: [], 
            disputes: urgentDisputes, 
            latestOrders,
            latestTenants,
            topStores,
            filters: req.query
        });
    }
    res.status(200).json({ success: true, data: { stats, disputes: urgentDisputes, topStores } });
});

exports.getOrders = asyncHandler(async (req, res) => {
    const user = req.session?.user || req.user;
    const isSuperAdmin = ['super-admin', 'super_admin'].includes(user?.role);
    const tenantId = isSuperAdmin ? null : user?.tenantId;
    
    const result = await orderService.getOrders(tenantId, req.query);

    if (req.accepts('html')) {
        return res.render('orders', { 
            layout: 'layouts/main',
            title: 'Danh sách đơn hàng',
            orders: result.orders || [],
            pagination: result,
            user,
            userName: user.name || 'Admin'
        });
    }
    res.status(200).json({ success: true, ...result });
});

/**
 * CẬP NHẬT: Lấy chi tiết đơn hàng cho hóa đơn (Invoice)
 */
exports.getOrderById = asyncHandler(async (req, res) => {
    const user = req.session?.user || req.user;
    const isSuperAdmin = ['super-admin', 'super_admin'].includes(user?.role);
    const tenantId = isSuperAdmin ? null : user?.tenantId;
    
    // Tìm đơn hàng và populate đầy đủ thông tin khách hàng và sản phẩm
    const order = await Order.findById(req.params.id)
        .populate('userId', 'name phone email address') // Thông tin khách hàng cho hóa đơn
        .populate('items.product', 'name price sku images') // Thông tin sản phẩm cho bảng hóa đơn
        .populate('tenantId', 'name shopName address phone logo') // Thông tin Shop
        .lean();

    if (!order) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });

    // Kiểm tra bảo mật đa khách thuê
    if (!isSuperAdmin && order.tenantId._id.toString() !== tenantId.toString()) {
        return res.status(403).json({ success: false, message: 'Bạn không có quyền xem đơn này' });
    }

    if (req.accepts('html')) {
        return res.render('order-detail', { 
            layout: 'layouts/main',
            title: `Đơn hàng #${order._id.toString().slice(-6).toUpperCase()}`,
            order, 
            user,
            userName: user.name || 'Admin'
        });
    }
    res.status(200).json({ success: true, data: order });
});

// ==========================================
// 3. QUY TRÌNH XỬ LÝ ĐƠN HÀNG
// ==========================================

exports.processOrder = asyncHandler(async (req, res) => {
    const tenantId = req.session?.user?.tenantId || req.user?.tenantId;
    const updatedOrder = await orderService.updateOrderStatus(req.params.id, tenantId, 'processing');
    emitOrderUpdate(req, updatedOrder.tenantId, { orderId: req.params.id, status: 'processing' });
    res.status(200).json({ success: true, data: updatedOrder });
});

exports.shipOrder = asyncHandler(async (req, res) => {
    const tenantId = req.session?.user?.tenantId || req.user?.tenantId;
    const updatedOrder = await orderService.updateOrderStatus(req.params.id, tenantId, 'shipping');
    emitOrderUpdate(req, updatedOrder.tenantId, { 
        orderId: req.params.id, 
        status: 'shipping', 
        message: 'Đã giao cho đơn vị vận chuyển' 
    });
    res.status(200).json({ success: true, data: updatedOrder });
});

exports.completeOrder = asyncHandler(async (req, res) => {
    const tenantId = req.session?.user?.tenantId || req.user?.tenantId;
    const updatedOrder = await orderService.updateOrderStatus(req.params.id, tenantId, 'completed');
    emitOrderUpdate(req, updatedOrder.tenantId, { orderId: req.params.id, status: 'completed' });
    res.status(200).json({ success: true, data: updatedOrder });
});

// ==========================================
// 4. TRỌNG TÀI & TRANH CHẤP
// ==========================================

exports.resolveDispute = asyncHandler(async (req, res) => {
    const { action, shopReason } = req.body; 
    const orderId = req.params.id;
    const user = req.session?.user || req.user;
    const isSuperAdmin = ['super-admin', 'super_admin'].includes(user?.role);
    
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Đơn hàng không tồn tại' });

    if (action === 'accept') {
        order.status = 'returned';
        if (order.dispute) {
            order.dispute.status = 'accepted';
            order.dispute.resolvedAt = new Date();
            order.dispute.finalVerdict = isSuperAdmin ? "Sàn duyệt hoàn tiền." : "Shop chấp nhận hoàn trả.";
        }
        await restockProducts(order); 
        await order.save();
        emitOrderUpdate(req, order.tenantId, { orderId, status: 'returned', message: 'Đã xác nhận hoàn tiền' });
        return res.status(200).json({ success: true, message: 'Xử lý thành công.' });
    } 
    
    if (!isSuperAdmin) {
        order.status = 'dispute_escalated'; 
        if (order.dispute) {
            order.dispute.status = 'processing';
            order.dispute.shopResponse = shopReason || 'Shop từ chối khiếu nại.';
        }
        await order.save();
        emitOrderUpdate(req, order.tenantId, { orderId, status: 'dispute_escalated', message: 'Khiếu nại chuyển cấp Sàn.' });
        return res.status(200).json({ success: true, message: 'Đã gửi khiếu nại lên Ban quản trị.' });
    }

    order.status = 'completed';
    if (order.dispute) {
        order.dispute.status = 'rejected';
        order.dispute.resolvedAt = new Date();
        order.dispute.finalVerdict = "Sàn bác bỏ khiếu nại người mua.";
    }
    await order.save();
    emitOrderUpdate(req, order.tenantId, { orderId, status: 'completed' });
    res.status(200).json({ success: true, message: 'Đã bác bỏ khiếu nại.' });
});
// của super-admin
exports.adminFinalVerdict = asyncHandler(async (req, res) => {
    const user = req.session?.user || req.user;
    if (!['super-admin', 'super_admin'].includes(user.role)) {
        return res.status(403).json({ success: false, message: "Quyền hạn không đủ" });
    }

    const { orderId, verdict, adminNote } = req.body; 
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false });

    if (verdict === 'REFUND_CUSTOMER') {
        order.status = 'returned';
        if (order.dispute) order.dispute.status = 'resolved';
        await restockProducts(order);
    } else {
        order.status = 'completed';
        if (order.dispute) order.dispute.status = 'rejected';
    }

    if (order.dispute) {
        order.dispute.finalVerdict = adminNote || "Quyết định từ Ban quản trị.";
        order.dispute.resolvedAt = new Date();
    }
    await order.save();
    emitOrderUpdate(req, order.tenantId, { orderId, status: order.status });
    res.json({ success: true, message: 'Đã thực thi phán quyết.' });
});

// ==========================================
// 5. CẬP NHẬT NHANH & HỦY ĐƠN
// ==========================================

exports.updateStatus = asyncHandler(async (req, res) => {
    const { orderId, status, note } = req.body;
    const user = req.session?.user || req.user;
    const isSuperAdmin = ['super_admin', 'super-admin'].includes(user.role);
    const tenantId = isSuperAdmin ? null : user.tenantId;

    const updatedOrder = await orderService.updateOrderStatus(orderId, tenantId, status, note, user.name);
    
    if (['cancelled', 'returned', 'failed'].includes(status)) {
        await restockProducts(updatedOrder);
    }

    emitOrderUpdate(req, updatedOrder.tenantId, { orderId, status });
    res.json({ success: true, data: updatedOrder });
});

exports.cancelOrder = asyncHandler(async (req, res) => {
    const user = req.session?.user || req.user;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Không tìm thấy" });

    await orderService.cancelOrder(req.params.id, user.tenantId);
    await restockProducts(order); 
    emitOrderUpdate(req, order.tenantId, { orderId: req.params.id, status: 'cancelled' });
    res.status(200).json({ success: true, message: 'Đơn hàng đã được hủy.' });
});