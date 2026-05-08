const OrderMapper = require('../mappers/OrderMapper');

class OrderRepository {
    constructor({ orderModel }) {
        this.orderModel = orderModel;
    }

    async create(orderEntity, options = {}) {
        const persistenceData = OrderMapper.toPersistence(orderEntity);
        
        // Cần xử lý array cho create nếu options.session được pass vào (như UseCase cũ)
        // Mongoose create(doc, options) -> Mongoose 6+ hỗ trợ mảng docs. Ta truyền mảng 1 phần tử.
        const docs = await this.orderModel.create([persistenceData], options);
        return OrderMapper.toDomain(docs[0]);
    }

    async findById(id) {
        const doc = await this.orderModel.findById(id).lean();
        return OrderMapper.toDomain(doc);
    }

    async findByCustomerId(customerId) {
        const docs = await this.orderModel.find({ customerId }).sort({ createdAt: -1 }).lean();
        return docs.map(doc => OrderMapper.toDomain(doc));
    }

    async findAll(query = {}) {
        const docs = await this.orderModel.find(query).sort({ createdAt: -1 }).lean();
        return docs.map(doc => OrderMapper.toDomain(doc));
    }

    async save(orderEntity, options = {}) {
        const persistenceData = OrderMapper.toPersistence(orderEntity);
        const doc = await this.orderModel.findOneAndUpdate(
            { _id: orderEntity.id },
            { $set: persistenceData },
            { new: true, ...options }
        ).lean();
        return OrderMapper.toDomain(doc);
    }

    async getDashboardStats() {
        // Tạm giữ logic aggregate của MongoDB vì phần này là hạ tầng (infrastructure) thuần túy
        // Không map sang Domain Entity vì nó trả về báo cáo (Read Model).
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
}

module.exports = OrderRepository;
