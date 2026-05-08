const mongoose = require('mongoose');

class OrderUseCases {
    constructor({ orderRepository, productRepository, customerRepository }) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.customerRepository = customerRepository;
    }

    async createOrder(userId, { items, paymentMethod = 'cod', shippingAddress, region = 'DEFAULT' }) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            let subtotal = 0;
            const orderItems = [];

            for (const item of items) {
                const pId = item.product || item.productId;
                const product = await this.productRepository.findById(pId);
                
                if (!product) throw new Error(`Sản phẩm với ID ${pId} không tồn tại`);
                if (product.stock < item.quantity) {
                    throw new Error(`Sản phẩm ${product.name} không đủ hàng trong kho`);
                }

                product.stock -= item.quantity;
                await product.save({ session });

                subtotal += product.price * item.quantity;
                orderItems.push({
                    product: product._id,
                    name: product.name,
                    quantity: item.quantity,
                    price: product.price
                });
            }

            const ShippingCalculator = require('../../../domain/services/ShippingCalculator');
            const shippingFee = ShippingCalculator.calculateFee(region);
            const totalAmount = subtotal + shippingFee;

            const newOrder = await this.orderRepository.create([{
                userId,
                customerId: userId,
                items: orderItems,
                subtotal,
                shippingFee,
                totalAmount,
                paymentMethod,
                shippingAddress,
                region,
                status: 'pending',
                paymentStatus: 'pending'
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

    async updateOrderStatus(orderId, status, adminNote = '', updatedBy = 'system') {
        const validStatuses = ['pending', 'processing', 'shipping', 'completed', 'cancelled', 'returned', 'failed', 'dispute_escalated'];
        if (!validStatuses.includes(status)) throw new Error('Trạng thái không hợp lệ');

        const updateData = { 
            $set: {
                status, 
                updatedBy,
                updatedAt: Date.now() 
            }
        };

        if (status === 'completed') updateData.$set.processedAt = Date.now();
        if (adminNote) updateData.$set.adminNote = adminNote;

        const order = await this.orderRepository.findOneAndUpdate({ _id: orderId }, updateData, { new: true })
            .populate('userId', 'name email');

        if (!order) throw new Error('Không tìm thấy đơn hàng');
        return order;
    }

    async updatePaymentStatus(orderId, status) {
        const order = await this.orderRepository.findOneAndUpdate(
            { _id: orderId },
            { $set: { paymentStatus: status } },
            { new: true }
        );
        if (!order) throw new Error('Không tìm thấy đơn hàng');
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
            "status": 'dispute_escalated', 
            "updatedAt": new Date()
        };

        return await this.orderRepository.findByIdAndUpdate(
            orderId, 
            { $set: updateData }, 
            { new: true }
        );
    }

    async resolveDispute(orderId, { action, response, imagesResponse }) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const order = await this.orderRepository.findById(orderId);
            if (!order) throw new Error('Không tìm thấy đơn hàng');

            if (action === 'accept') {
                order.status = 'returned';
                order.dispute.status = 'resolved';
                
                for (const item of order.items) {
                    await this.productRepository.updateOne(
                        { _id: item.product },
                        { $inc: { stock: item.quantity } },
                        { session }
                    );
                }
            } else {
                order.status = 'completed'; // Hoặc giữ nguyên trạng thái
                order.dispute.status = 'rejected';
            }

            order.dispute.response = response;
            order.dispute.imagesResponse = imagesResponse || [];
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

    async cancelOrder(orderId) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const order = await this.orderRepository.findById(orderId);
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

    async getDashboardStats() {
        const [totalProducts, allOrders] = await Promise.all([
            this.productRepository.countDocuments(),
            this.orderRepository.find().lean()
        ]);

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

        const latestOrders = await this.orderRepository.find()
            .populate('userId', 'name')
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

        const disputes = await this.orderRepository.find({
            "dispute.isDisputed": true,
            "dispute.status": "pending"
        }).lean();

        return { stats, latestOrders, disputes };
    }

    async getOrders(query) {
        const { page = 1, limit = 10, status, search } = query;
        const skip = (page - 1) * limit;
        const filter = {};
        
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

    async getOrderById(orderId) {
        return await this.orderRepository.findOne({ _id: orderId })
            .populate('userId', 'name phone email address')
            .populate('items.product', 'name price sku images')
            .lean();
    }
}

module.exports = OrderUseCases;
