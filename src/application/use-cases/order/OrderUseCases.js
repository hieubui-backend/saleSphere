const mongoose = require('mongoose');

class OrderUseCases {
    constructor({ orderRepository, productRepository, customerRepository }) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.customerRepository = customerRepository;
    }

    async createOrder(userId, { items, paymentMethod = 'cod', shippingAddress, region = 'DEFAULT' }) {
        const ProductEntity = require('../../../domain/entities/Product');
        const OrderEntity = require('../../../domain/entities/Order');

        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            // 1. Khởi tạo Domain Entity cho Order
            const order = new OrderEntity({
                customerId: userId,
                shippingAddress,
                region,
                paymentMethod
            });

            // 2. Xử lý từng item thông qua Domain Entity
            for (const item of items) {
                const pId = item.product || item.productId;
                const productDoc = await this.productRepository.findById(pId);
                
                if (!productDoc) throw new Error(`Sản phẩm với ID ${pId} không tồn tại`);

                // Chuyển đổi Mongoose Doc sang Domain Entity
                const product = new ProductEntity({
                    id: productDoc._id,
                    name: productDoc.name,
                    price: productDoc.price,
                    stock: productDoc.stock
                });

                // Domain Entity tự xử lý logic trừ kho và validate
                order.addItem(product, item.quantity);

                // Cập nhật lại trạng thái kho vào Database
                productDoc.stock = product.stock;
                await productDoc.save({ session });
            }

            // 3. Lưu Order thông qua Repository
            const newOrder = await this.orderRepository.create([{
                userId: order.customerId,
                customerId: order.customerId,
                items: order.items,
                subtotal: order.subtotal,
                shippingFee: order.shippingFee,
                totalAmount: order.totalAmount,
                paymentMethod: order.paymentMethod,
                shippingAddress: order.shippingAddress,
                region: order.region,
                status: order.status,
                paymentStatus: order.paymentStatus
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
        const OrderEntity = require('../../../domain/entities/Order');
        const orderDoc = await this.orderRepository.findById(orderId);
        if (!orderDoc) throw new Error('Không tìm thấy đơn hàng');

        // Tạo Domain Entity từ Data hiện tại
        const order = new OrderEntity({
            customerId: orderDoc.customerId,
            shippingAddress: orderDoc.shippingAddress,
            region: orderDoc.region,
            paymentMethod: orderDoc.paymentMethod
        });
        order.status = orderDoc.status;

        // Chuyển trạng thái bằng Domain logic (Tự động validate bằng State Machine)
        order.changeStatus(status);

        const updateData = { 
            $set: {
                status: order.status, 
                updatedBy,
                updatedAt: Date.now() 
            }
        };

        if (order.status === 'completed') updateData.$set.processedAt = Date.now();
        if (adminNote) updateData.$set.adminNote = adminNote;

        const updatedOrder = await this.orderRepository.findOneAndUpdate({ _id: orderId }, updateData, { new: true })
            .populate('userId', 'name email');

        return updatedOrder;
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
