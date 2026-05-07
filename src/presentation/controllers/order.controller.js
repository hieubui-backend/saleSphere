const asyncHandler = require('express-async-handler');

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
    const { orderUseCases } = req.container.cradle;
    const order = await orderUseCases.createOrder(user?.tenantId, user?.id || user?._id, req.body);
    
    emitOrderUpdate(req, order.tenantId, { orderId: order._id, status: 'pending' });
    res.status(201).json({ success: true, data: order });
});

exports.handleLogisticsWebhook = asyncHandler(async (req, res) => {
    const { order_id, status, partner, tracking_number } = req.body;
    const { orderUseCases } = req.container.cradle;
    
    const { order, finalStatus } = await orderUseCases.handleLogisticsWebhook(order_id, status, partner, tracking_number);

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
    const { orderUseCases } = req.container.cradle;

    const data = await orderUseCases.getDashboardStats(user);

    if (req.accepts('html')) {
        return res.render('dashboard', { 
            layout: 'layouts/main',
            title: isSuperAdmin ? 'Hệ thống Quản trị Toàn sàn' : 'Báo cáo Cửa hàng',
            user,
            userName: user.name || 'Admin', 
            stats: data.stats,
            chart: [], 
            disputes: data.disputes, 
            latestOrders: data.latestOrders,
            latestTenants: data.latestTenants,
            topStores: data.topStores,
            filters: req.query
        });
    }
    res.status(200).json({ success: true, data });
});

exports.getOrders = asyncHandler(async (req, res) => {
    const user = req.session?.user || req.user;
    const isSuperAdmin = ['super-admin', 'super_admin'].includes(user?.role);
    const tenantId = isSuperAdmin ? null : user?.tenantId;
    
    const { orderUseCases } = req.container.cradle;
    const result = await orderUseCases.getOrders(tenantId, req.query);

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

exports.getOrderById = asyncHandler(async (req, res) => {
    const user = req.session?.user || req.user;
    const isSuperAdmin = ['super-admin', 'super_admin'].includes(user?.role);
    const tenantId = isSuperAdmin ? null : user?.tenantId;
    
    const { orderUseCases } = req.container.cradle;
    const order = await orderUseCases.getOrderById(req.params.id, tenantId);

    if (!order) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
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
    const { orderUseCases } = req.container.cradle;
    const updatedOrder = await orderUseCases.updateOrderStatus(req.params.id, tenantId, 'processing');
    emitOrderUpdate(req, updatedOrder.tenantId, { orderId: req.params.id, status: 'processing' });
    res.status(200).json({ success: true, data: updatedOrder });
});

exports.shipOrder = asyncHandler(async (req, res) => {
    const tenantId = req.session?.user?.tenantId || req.user?.tenantId;
    const { orderUseCases } = req.container.cradle;
    const updatedOrder = await orderUseCases.updateOrderStatus(req.params.id, tenantId, 'shipping');
    emitOrderUpdate(req, updatedOrder.tenantId, { 
        orderId: req.params.id, 
        status: 'shipping', 
        message: 'Đã giao cho đơn vị vận chuyển' 
    });
    res.status(200).json({ success: true, data: updatedOrder });
});

exports.completeOrder = asyncHandler(async (req, res) => {
    const tenantId = req.session?.user?.tenantId || req.user?.tenantId;
    const { orderUseCases } = req.container.cradle;
    const updatedOrder = await orderUseCases.updateOrderStatus(req.params.id, tenantId, 'completed');
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
    const { orderUseCases } = req.container.cradle;
    
    const order = await orderUseCases.resolveDispute(orderId, isSuperAdmin ? null : user.tenantId, { action, shopResponse: shopReason });
    
    emitOrderUpdate(req, order.tenantId, { 
        orderId, 
        status: order.status, 
        message: isSuperAdmin ? 'Đã xử lý khiếu nại' : 'Đã gửi khiếu nại lên Ban quản trị' 
    });
    return res.status(200).json({ success: true, message: 'Xử lý thành công.' });
});

exports.adminFinalVerdict = asyncHandler(async (req, res) => {
    const user = req.session?.user || req.user;
    if (!['super-admin', 'super_admin'].includes(user.role)) {
        return res.status(403).json({ success: false, message: "Quyền hạn không đủ" });
    }

    const { orderId, verdict, adminNote } = req.body; 
    const { orderUseCases } = req.container.cradle;
    const order = await orderUseCases.resolveDisputeFinal(orderId, { verdict, adminNote });

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

    const { orderUseCases } = req.container.cradle;
    const updatedOrder = await orderUseCases.updateOrderStatus(orderId, tenantId, status, note, user.name);

    if (['cancelled', 'returned', 'failed'].includes(status)) {
        await orderUseCases.restockProducts(updatedOrder);
    }

    emitOrderUpdate(req, updatedOrder.tenantId, { orderId, status });
    res.json({ success: true, data: updatedOrder });
});

exports.cancelOrder = asyncHandler(async (req, res) => {
    const user = req.session?.user || req.user;
    const { orderUseCases } = req.container.cradle;
    const order = await orderUseCases.cancelOrder(req.params.id, user.tenantId);
    
    emitOrderUpdate(req, order.tenantId, { orderId: req.params.id, status: 'cancelled' });
    res.status(200).json({ success: true, message: 'Đơn hàng đã được hủy.' });
});