import mongoose from 'mongoose';
import OrderEntity from '../../../domain/entities/OrderEntity';
import ProductEntity from '../../../domain/entities/ProductEntity';
import { IOrderRepository } from '../../../domain/repositories/IOrderRepository';
import { IProductRepository } from '../../../domain/repositories/IProductRepository';
import { ICustomerRepository } from '../../../domain/repositories/ICustomerRepository';

export default class OrderUseCases {
    private orderRepository: IOrderRepository;
    private productRepository: IProductRepository;
    private customerRepository: ICustomerRepository;

    constructor({ orderRepository, productRepository, customerRepository }: { 
        orderRepository: IOrderRepository, 
        productRepository: IProductRepository, 
        customerRepository: ICustomerRepository 
    }) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.customerRepository = customerRepository;
    }

    public async createOrder(userId: string, { items, paymentMethod = 'cod', shippingAddress, region = 'DEFAULT' }: any): Promise<OrderEntity | null> {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const order = new OrderEntity({
                customerId: userId,
                shippingAddress,
                region,
                paymentMethod
            });

            for (const item of items) {
                const pId = item.product || item.productId;
                const productEntity = await this.productRepository.findById(pId);
                
                if (!productEntity) throw new Error(`Sản phẩm với ID ${pId} không tồn tại`);

                order.addItem(productEntity, item.quantity);

                // Update stock in DB
                await this.productRepository.updateById(pId, productEntity);
            }

            const newOrder = await this.orderRepository.create(order, { session });

            await session.commitTransaction();
            return newOrder;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    public async handleLogisticsWebhook(orderId: string, status: string, partner?: string, trackingNumber?: string): Promise<any> {
        const order = await this.orderRepository.findById(orderId);
        if (!order) throw new Error('Không tìm thấy đơn hàng');

        const statusMap: Record<string, string> = {
            'delivering': 'shipping',
            'delivered': 'completed',
            'failed': 'failed',
            'returned': 'returned'
        };
        const finalStatus = statusMap[status.toLowerCase()] || status.toLowerCase();

        order.status = finalStatus;
        if (partner) (order as any).shippingPartner = partner;
        if (trackingNumber) (order as any).trackingNumber = trackingNumber;
        
        const updatedOrder = await this.orderRepository.save(order);

        if (['returned', 'cancelled', 'failed'].includes(finalStatus)) {
            await this.restockProducts(order);
        }
        return { order: updatedOrder, finalStatus };
    }

    public async updateOrderStatus(orderId: string, status: string, adminNote: string = '', updatedBy: string = 'system'): Promise<OrderEntity | null> {
        const order = await this.orderRepository.findById(orderId);
        if (!order) throw new Error('Không tìm thấy đơn hàng');

        order.changeStatus(status);
        (order as any).adminNote = adminNote;
        
        return await this.orderRepository.save(order);
    }

    public async updatePaymentStatus(orderId: string, status: string): Promise<OrderEntity | null> {
        const order = await this.orderRepository.findById(orderId);
        if (!order) throw new Error('Không tìm thấy đơn hàng');
        
        order.updatePaymentStatus(status);
        return await this.orderRepository.save(order);
    }

    public async restockProducts(order: OrderEntity): Promise<void> {
        if (!order || !order.items || order.items.length === 0) return;
        try {
            for (const item of order.items) {
                const product = await this.productRepository.findById(item.product);
                if (product) {
                    product.addStock(item.quantity);
                    await this.productRepository.updateById(item.product, product);
                }
            }
        } catch (error) {
            console.error("Lỗi hoàn kho:", error);
        }
    }

    public async getDashboardStats(): Promise<any> {
        return await this.orderRepository.getDashboardStats();
    }

    public async getOrders(query: any): Promise<any> {
        const orders = await this.orderRepository.findAll(query);
        return { orders, totalOrders: orders.length };
    }

    public async getOrderById(orderId: string): Promise<OrderEntity | null> {
        return await this.orderRepository.findById(orderId);
    }

    public async resolveDispute(orderId: string, { action, response }: any): Promise<any> {
        const order = await this.orderRepository.findById(orderId);
        if (!order) throw new Error('Không tìm thấy đơn hàng');

        if (action === 'refund') {
            order.status = 'cancelled';
            await this.restockProducts(order);
        } else {
            order.status = 'completed';
        }
        
        return await this.orderRepository.save(order);
    }

    public async cancelOrder(orderId: string): Promise<OrderEntity | null> {
        const order = await this.orderRepository.findById(orderId);
        if (!order) throw new Error('Không tìm thấy đơn hàng');

        order.status = 'cancelled';
        await this.restockProducts(order);
        return await this.orderRepository.save(order);
    }
}





