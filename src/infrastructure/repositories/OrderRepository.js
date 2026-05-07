class OrderRepository {
    constructor({ orderModel }) {
        this.orderModel = orderModel;
    }

    findById(id, options = {}) {
        return this.orderModel.findById(id, null, options);
    }

    findOne(query, options = {}) {
        return this.orderModel.findOne(query, null, options);
    }

    find(query, options = {}) {
        return this.orderModel.find(query, null, options);
    }

    async create(data, options = {}) {
        return await this.orderModel.create(data, options);
    }

    findByIdAndUpdate(id, update, options = {}) {
        return this.orderModel.findByIdAndUpdate(id, update, options);
    }

    findOneAndUpdate(query, update, options = {}) {
        return this.orderModel.findOneAndUpdate(query, update, options);
    }

    async countDocuments(query = {}) {
        return await this.orderModel.countDocuments(query);
    }

    async aggregate(pipeline) {
        return await this.orderModel.aggregate(pipeline);
    }
}

module.exports = OrderRepository;
