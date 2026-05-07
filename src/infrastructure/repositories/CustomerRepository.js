class CustomerRepository {
    constructor({ customerModel }) {
        this.customerModel = customerModel;
    }

    findByEmail(email) {
        return this.customerModel.findOne({ email });
    }

    findById(id) {
        return this.customerModel.findById(id);
    }

    findOne(query) {
        return this.customerModel.findOne(query);
    }

    async create(data) {
        const customer = new this.customerModel(data);
        return await customer.save();
    }

    updateById(id, data) {
        return this.customerModel.findByIdAndUpdate(id, data, { new: true });
    }

    async deleteById(id) {
        return await this.customerModel.findByIdAndDelete(id);
    }

    async countDocuments(filter = {}) {
        return await this.customerModel.countDocuments(filter);
    }

    async findAll(filter = {}, sort = { createdAt: -1 }) {
        return await this.customerModel.find(filter).sort(sort).lean();
    }
}

module.exports = CustomerRepository;
