import { Model } from 'mongoose';
import OrderEntity from '../../domain/entities/OrderEntity';
import OrderMapper from '../mappers/OrderMapper';
import { IOrder } from '../database/models/order.model';

import { IOrderRepository } from '../../domain/repositories/IOrderRepository';

export default class OrderRepository implements IOrderRepository {
    private orderModel: Model<IOrder>;

    constructor({ orderModel }: { orderModel: Model<IOrder> }) {
        this.orderModel = orderModel;
    }

    public async create(orderEntity: OrderEntity, options: any = {}): Promise<OrderEntity | null> {
        const persistenceData = OrderMapper.toPersistence(orderEntity);
        const docs = await this.orderModel.create([persistenceData], options);
        return OrderMapper.toDomain(docs[0]);
    }

    public async findById(id: string): Promise<OrderEntity | null> {
        const doc = await this.orderModel.findById(id).lean();
        return OrderMapper.toDomain(doc);
    }

    public async findByCustomerId(customerId: string): Promise<OrderEntity[]> {
        const docs = await this.orderModel.find({ customerId }).sort({ createdAt: -1 }).lean();
        return docs.map(doc => OrderMapper.toDomain(doc)!);
    }

    public async findAll(query: any = {}): Promise<OrderEntity[]> {
        const docs = await this.orderModel.find(query).sort({ createdAt: -1 }).lean();
        return docs.map(doc => OrderMapper.toDomain(doc)!);
    }

    public async save(orderEntity: OrderEntity, options: any = {}): Promise<OrderEntity | null> {
        const persistenceData = OrderMapper.toPersistence(orderEntity);
        const doc = await this.orderModel.findOneAndUpdate(
            { _id: orderEntity.id },
            { $set: persistenceData },
            { new: true, ...options }
        ).lean();
        return OrderMapper.toDomain(doc);
    }

    public async getDashboardStats(): Promise<any> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [dailyRevenue, totalOrders, pendingOrders] = await Promise.all([
            this.orderModel.aggregate([
                { $match: { createdAt: { $gte: today }, status: 'completed' } },
                { $group: { _id: null, total: { $sum: '$totalAmount' } } }
            ]),
            this.orderModel.countDocuments(),
            this.orderModel.countDocuments({ status: 'pending' })
        ]);

        return {
            dailyRevenue: dailyRevenue[0]?.total || 0,
            totalOrders,
            pendingOrders
        };
    }

    public async findByOrderCode(orderCode: number): Promise<OrderEntity | null> {
        const doc = await this.orderModel.findOne({ orderCode }).lean();
        return OrderMapper.toDomain(doc);
    }
}





