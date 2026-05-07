const Order = require('../modules/order/order.model');
const Product = require('../infrastructure/database/models/product.model');
const Customer = require('../modules/customer/customer.model');
const Tenant = require('../infrastructure/database/models/tenant.model');
const mongoose = require('mongoose');

/**
 * 1. TẠO ĐƠN HÀNG MỚI (Sử dụng Transaction)
 */
const createOrder = async (tenantId, userId, { items }) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        let totalAmount = 0;
        const orderItems = [];

        for (const item of items) {
            const pId = item.product || item.productId;
            const product = await Product.findOne({ _id: pId, tenantId }).session(session);
            
            if (!product) throw new Error(`Sản phẩm với ID ${pId} không tồn tại`);
            if (product.stock < item.quantity) {
                throw new Error(`Sản phẩm ${product.name} không đủ hàng trong kho`);
            }

            product.stock -= item.quantity;
            await product.save({ session });

            totalAmount += product.price * item.quantity;
            orderItems.push({
                product: product._id,
                name: product.name,
                quantity: item.quantity,
                price: product.price
            });
        }

        const newOrder = await Order.create([{
            tenantId,
            userId, // Lưu để khớp với DB cũ
            customerId: userId, // Lưu để khớp với logic mới
            items: orderItems,
            totalAmount,
            status: 'pending' 
        }], { session });

        await session.commitTransaction();
        return newOrder[0];
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

/**
 * 2. CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG THÔNG THƯỜNG
 */
const updateOrderStatus = async (orderId, tenantId, status, adminNote = '', updatedBy = 'system') => {
    const validStatuses = ['pending', 'processing', 'shipping', 'completed', 'cancelled', 'returned', 'failed', 'dispute_escalated', 'waiting_approval'];
    if (!validStatuses.includes(status)) throw new Error('Trạng thái không hợp lệ');

    const query = { _id: orderId };
    if (tenantId) query.tenantId = tenantId; 

    const updateData = { 
        $set: {
            status, 
            updatedBy,
            updatedAt: Date.now() 
        }
    };

    if (status === 'completed') updateData.$set.processedAt = Date.now();
    if (adminNote) updateData.$set.adminNote = adminNote;

    const order = await Order.findOneAndUpdate(query, updateData, { new: true })
        .populate('tenantId', 'shopName')
        .populate('userId', 'name email');

    if (!order) throw new Error('Không tìm thấy đơn hàng hoặc bạn không có quyền chỉnh sửa');
    return order;
};

/**
 * 3. KHÁCH HÀNG GỬI KHIẾU NẠI (DISPUTE)
 */
const handleDispute = async (orderId, { reason, description, images, type = 'return_refund' }) => {
    const updateData = {
        "dispute.isDisputed": true,
        "dispute.type": type,
        "dispute.reason": reason,
        "dispute.description": description,
        "dispute.images": images,
        "dispute.status": 'pending', 
        "dispute.requestedAt": new Date(),
        "status": 'waiting_approval', 
        "updatedAt": new Date()
    };

    return await Order.findByIdAndUpdate(
        orderId, 
        { $set: updateData }, 
        { new: true }
    );
};

/**
 * 4. SHOP PHẢN HỒI KHIẾU NẠI (Cấp độ 1)
 */
const resolveDispute = async (orderId, tenantId, { action, shopResponse, shopImages }) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const order = await Order.findOne({ _id: orderId, tenantId }).session(session);
        if (!order) throw new Error('Không tìm thấy đơn hàng');

        if (action === 'accept') {
            order.status = 'returned';
            order.dispute.status = 'accepted';
            
            for (const item of order.items) {
                await Product.updateOne(
                    { _id: item.product },
                    { $inc: { stock: item.quantity } },
                    { session }
                );
            }
        } else {
            order.status = 'dispute_escalated'; 
            order.dispute.status = 'processing';
            order.dispute.escalatedAt = new Date();
        }

        order.dispute.shopResponse = shopResponse;
        order.dispute.shopImages = shopImages || [];
        order.dispute.resolvedAt = new Date();
        order.updatedAt = Date.now();

        await order.save({ session });
        await session.commitTransaction();
        return order;
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

/**
 * 5. PHÁN QUYẾT TRỌNG TÀI (Dành cho Super Admin)
 * CẬP NHẬT: Xử lý triệt để lỗi thiếu customerId và logic PAY_SHOP
 */
const resolveDisputeFinal = async (orderId, { verdict, adminNote }) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const order = await Order.findById(orderId).session(session);
        if (!order) throw new Error('Đơn hàng không tồn tại');

        // FIX: Đảm bảo customerId không bị trống để vượt qua Validation của Model
        if (!order.customerId && order.userId) {
            order.customerId = order.userId;
        }

        if (verdict === 'REFUND_CUSTOMER') {
            // ADMIN PHÁN QUYẾT HOÀN TIỀN KHÁCH: Trạng thái về 'returned' và hoàn kho
            order.status = 'returned';
            order.dispute.status = 'resolved';
            
            for (const item of order.items) {
                await Product.updateOne(
                    { _id: item.product },
                    { $inc: { stock: item.quantity } },
                    { session }
                );
            }
        } else if (verdict === 'PAY_SHOP') {
            // ADMIN PHÁN QUYẾT TRẢ TIỀN SHOP: Trạng thái về 'completed' (Đơn hàng thành công)
            order.status = 'completed';
            order.dispute.status = 'rejected'; 
            order.processedAt = Date.now();
        }

        order.adminNote = `[PHÁN QUYẾT SÀN]: ${adminNote}`;
        order.dispute.finalVerdict = verdict;
        order.dispute.resolvedAt = new Date();
        order.updatedAt = Date.now();
        order.updatedBy = 'super_admin';

        // Sử dụng validateModifiedOnly để tránh check lại các trường cũ không liên quan nếu cần
        await order.save({ session });
        
        await session.commitTransaction();
        return order;
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

/**
 * 6. HỦY ĐƠN HÀNG VÀ HOÀN TỒN KHO
 */
const cancelOrder = async (orderId, tenantId) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const query = { _id: orderId };
        if (tenantId) query.tenantId = tenantId;

        const order = await Order.findOne(query).session(session);
        if (!order || ['cancelled', 'completed', 'returned'].includes(order.status)) {
            throw new Error('Đơn hàng không thể hủy ở trạng thái hiện tại');
        }

        for (const item of order.items) {
            await Product.updateOne(
                { _id: item.product },
                { $inc: { stock: item.quantity } },
                { session }
            );
        }

        order.status = 'cancelled';
        order.updatedAt = Date.now();
        await order.save({ session });
        
        await session.commitTransaction();
        return order;
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

/**
 * 7. THỐNG KÊ DASHBOARD CHUYÊN SÂU
 */
const getDashboardStats = async (tenantId = null) => {
    const matchQuery = {};
    if (tenantId) matchQuery.tenantId = new mongoose.Types.ObjectId(tenantId);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    let actionRequiredFilter;
    if (tenantId) {
        actionRequiredFilter = {
            $or: [
                { "status": "pending" },
                { "dispute.status": "pending", "dispute.isDisputed": true }
            ]
        };
    } else {
        actionRequiredFilter = {
            $or: [
                { "status": "dispute_escalated" },
                { "status": "failed" },
                { "status": "waiting_approval" }
            ]
        };
    }

    const [totalProducts, totalCustomers, totalTenants, overview] = await Promise.all([
        Product.countDocuments(tenantId ? { tenantId } : {}),
        Customer.countDocuments({}),
        !tenantId ? Tenant.countDocuments({}) : Promise.resolve(0),
        Order.aggregate([
            { $match: matchQuery },
            { 
                $facet: {
                    "mainStats": [
                        {
                            $group: {
                                _id: null,
                                totalOrders: { $sum: 1 },
                                totalRevenue: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, "$totalAmount", 0] } },
                                shippingCount: { $sum: { $cond: [{ $eq: ["$status", "shipping"] }, 1, 0] } },
                                completedTodayCount: { 
                                    $sum: { $cond: [{ $and: [{ $eq: ["$status", "completed"] }, { $gte: ["$updatedAt", todayStart] }]}, 1, 0] } 
                                },
                                cancelledCount: { $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] } },
                                returnedCount: { $sum: { $cond: [{ $eq: ["$status", "returned"] }, 1, 0] } },
                                failedCount: { $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] } },
                                pendingApprovalCount: { $sum: { $cond: [{ $eq: ["$status", "waiting_approval"] }, 1, 0] } }
                            }
                        }
                    ],
                    "chartData": [
                        { $sort: { createdAt: -1 } },
                        { $limit: 300 }, 
                        {
                            $group: {
                                _id: { $dateToString: { format: "%d/%m", date: "$createdAt" } },
                                revenue: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, "$totalAmount", 0] } }
                            }
                        },
                        { $sort: { "_id": 1 } }
                    ],
                    "actionRequired": [
                        { $match: actionRequiredFilter },
                        { $sort: { updatedAt: -1 } },
                        { $limit: 10 },
                        {
                            $lookup: {
                                from: "tenants",
                                localField: "tenantId",
                                foreignField: "_id",
                                as: "shopInfo"
                            }
                        },
                        { $unwind: { path: "$shopInfo", preserveNullAndEmptyArrays: true } },
                        {
                            $project: {
                                _id: 1,
                                totalAmount: 1,
                                status: 1,
                                updatedAt: 1,
                                dispute: 1,
                                shopName: { $ifNull: ["$shopInfo.shopName", "Hệ thống"] }
                            }
                        }
                    ]
                }
            }
        ])
    ]);

    const result = overview[0];
    const stats = result.mainStats[0] || { totalOrders: 0, totalRevenue: 0 };

    return {
        summary: {
            tenants: totalTenants || 0,
            totalProducts: totalProducts || 0,
            customers: totalCustomers || 0,
            orders: stats.totalOrders || 0,
            revenue: stats.totalRevenue || 0,
            shipping: stats.shippingCount || 0,
            completedToday: stats.completedTodayCount || 0,
            cancelled: stats.cancelledCount || 0,
            returned: stats.returnedCount || 0,
            failed: stats.failedCount || 0,
            pendingApproval: stats.pendingApprovalCount || 0
        },
        chart: {
            labels: result.chartData ? result.chartData.map(d => d._id) : [],
            values: result.chartData ? result.chartData.map(d => d.revenue) : []
        },
        actionRequired: result.actionRequired || []
    };
};

/**
 * 8. TRUY VẤN DANH SÁCH ĐƠN HÀNG
 */
const getOrders = async (tenantId, query) => {
    const { page = 1, limit = 10, status, search } = query;
    const skip = (page - 1) * limit;
    const filter = {};
    
    if (tenantId) filter.tenantId = tenantId;
    if (status) filter.status = status;
    if (search) {
        filter.$or = [
            { _id: mongoose.isValidObjectId(search) ? search : undefined },
            { "items.name": { $regex: search, $options: 'i' } }
        ].filter(Boolean);
    }

    const [orders, total] = await Promise.all([
        Order.find(filter)
            .populate('userId', 'name email')
            .populate('tenantId', 'shopName')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .lean(),
        Order.countDocuments(filter)
    ]);

    return { 
        orders, 
        totalOrders: total, 
        currentPage: Number(page), 
        totalPages: Math.ceil(total / limit) 
    };
};

/**
 * 9. LẤY CHI TIẾT ĐƠN HÀNG
 */
const getOrderById = async (orderId, tenantId) => {
    const query = { _id: orderId };
    if (tenantId) query.tenantId = tenantId;
    return await Order.findOne(query)
        .populate('userId', 'name email')
        .populate('tenantId', 'shopName')
        .lean();
};

module.exports = { 
    createOrder, 
    updateOrderStatus, 
    handleDispute,
    resolveDispute,
    resolveDisputeFinal,
    getOrders, 
    getOrderById, 
    cancelOrder, 
    getDashboardStats 
};