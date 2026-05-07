const mongoose = require('mongoose');

class OrderUseCases {
    constructor({ orderRepository, productRepository, customerRepository, tenantRepository }) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.customerRepository = customerRepository;
        this.tenantRepository = tenantRepository;
    }

    async createOrder(tenantId, userId, { items }) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            let totalAmount = 0;
            const orderItems = [];

            for (const item of items) {
                const pId = item.product || item.productId;
                const product = await this.productRepository.findOne({ _id: pId, tenantId }, { session });
                
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

            const newOrder = await this.orderRepository.create([{
                tenantId,
                userId,
                customerId: userId,
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
    }

    async handleLogisticsWebhook(orderId, status, partner, trackingNumber) {
        const order = await this.orderRepository.findById(orderId);
        if (!order) throw new Error('Không tìm thấy đơn hàng');

        const statusMap = {
            'delivering': 'shipping',
            'delivered': 'completed',
            'failed': 'failed',
            'returned': 'returned'
        };
        const finalStatus = statusMap[status.toLowerCase()] || status.toLowerCase();

        const updateData = {
            status: finalStatus,
            updatedBy: `Webhook: ${partner || 'Logistics Partner'}`,
            updatedAt: Date.now()
        };

        if (partner) updateData.shippingPartner = partner;
        if (trackingNumber) updateData.trackingNumber = trackingNumber;
        if (finalStatus === 'completed') updateData.processedAt = Date.now();

        const updatedOrder = await this.orderRepository.findOneAndUpdate({ _id: orderId }, { $set: updateData }, { new: true });

        if (['returned', 'cancelled', 'failed'].includes(finalStatus)) {
            await this.restockProducts(updatedOrder);
        }
        return { order: updatedOrder, finalStatus };
    }

    async updateOrderStatus(orderId, tenantId, status, adminNote = '', updatedBy = 'system') {
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

        const order = await this.orderRepository.findOneAndUpdate(query, updateData, { new: true })
            .populate('tenantId', 'shopName')
            .populate('userId', 'name email');

        if (!order) throw new Error('Không tìm thấy đơn hàng hoặc bạn không có quyền chỉnh sửa');
        return order;
    }

    async handleDispute(orderId, { reason, description, images, type = 'return_refund' }) {
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

        return await this.orderRepository.findByIdAndUpdate(
            orderId, 
            { $set: updateData }, 
            { new: true }
        );
    }

    async resolveDispute(orderId, tenantId, { action, shopResponse, shopImages }) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const order = await this.orderRepository.findOne({ _id: orderId, tenantId }, { session });
            if (!order) throw new Error('Không tìm thấy đơn hàng');

            if (action === 'accept') {
                order.status = 'returned';
                order.dispute.status = 'accepted';
                
                for (const item of order.items) {
                    await this.productRepository.updateOne(
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
    }

    async resolveDisputeFinal(orderId, { verdict, adminNote }) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const order = await this.orderRepository.findById(orderId, { session });
            if (!order) throw new Error('Đơn hàng không tồn tại');

            if (!order.customerId && order.userId) {
                order.customerId = order.userId;
            }

            if (verdict === 'REFUND_CUSTOMER') {
                order.status = 'returned';
                order.dispute.status = 'resolved';
                
                for (const item of order.items) {
                    await this.productRepository.updateOne(
                        { _id: item.product },
                        { $inc: { stock: item.quantity } },
                        { session }
                    );
                }
            } else if (verdict === 'PAY_SHOP') {
                order.status = 'completed';
                order.dispute.status = 'rejected'; 
                order.processedAt = Date.now();
            }

            order.adminNote = `[PHÁN QUYẾT SÀN]: ${adminNote}`;
            order.dispute.finalVerdict = verdict;
            order.dispute.resolvedAt = new Date();
            order.updatedAt = Date.now();
            order.updatedBy = 'super_admin';

            await order.save({ session });
            
            await session.commitTransaction();
            return order;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    async restockProducts(order) {
        if (!order || !order.items || order.items.length === 0) return;
        try {
            const updatePromises = order.items.map(item => {
                const pId = item.product || item.productId;
                if (pId) {
                    return this.productRepository.findByIdAndUpdate(pId, {
                        $inc: { stock: item.quantity }
                    });
                }
            });
            await Promise.all(updatePromises);
        } catch (error) {
            console.error("Lỗi hoàn kho:", error);
        }
    }

    async cancelOrder(orderId, tenantId) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const query = { _id: orderId };
            if (tenantId) query.tenantId = tenantId;

            const order = await this.orderRepository.findOne(query, { session });
            if (!order || ['cancelled', 'completed', 'returned'].includes(order.status)) {
                throw new Error('Đơn hàng không thể hủy ở trạng thái hiện tại');
            }

            for (const item of order.items) {
                await this.productRepository.updateOne(
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
    }

    async getDashboardStats(user) {
        const isSuperAdmin = ['super-admin', 'super_admin'].includes(user?.role);
        const tenantId = isSuperAdmin ? null : user?.tenantId;
        const filter = tenantId ? { tenantId } : {};

        const urgentDisputes = await this.orderRepository.find({
            ...filter,
            status: 'dispute_escalated'
        })
        .populate('tenantId', 'name')
        .sort({ updatedAt: -1 })
        .lean();

        const [totalProducts, allOrders, allTenants] = await Promise.all([
            this.productRepository.countDocuments(filter),
            this.orderRepository.find(filter).lean(),
            this.tenantRepository.findAll()
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

        const latestOrders = await this.orderRepository.find(filter)
            .populate('userId', 'name')
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

        const latestTenants = isSuperAdmin 
            ? allTenants.sort((a, b) => b.createdAt - a.createdAt).slice(0, 5)
            : [];

        return { stats, disputes: urgentDisputes, topStores, latestOrders, latestTenants };
    }

    async getOrders(tenantId, query) {
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
            this.orderRepository.find(filter)
                .populate('userId', 'name email')
                .populate('tenantId', 'shopName')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            this.orderRepository.countDocuments(filter)
        ]);

        return { 
            orders, 
            totalOrders: total, 
            currentPage: Number(page), 
            totalPages: Math.ceil(total / limit) 
        };
    }

    async getOrderById(orderId, tenantId) {
        const query = { _id: orderId };
        if (tenantId) query.tenantId = tenantId;
        return await this.orderRepository.findOne(query)
            .populate('userId', 'name phone email address')
            .populate('items.product', 'name price sku images')
            .populate('tenantId', 'name shopName address phone logo')
            .lean();
    }
}

module.exports = OrderUseCases;
