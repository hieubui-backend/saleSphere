const CustomerMapper = require('../mappers/CustomerMapper');

class CustomerRepository {
    constructor({ customerModel }) {
        this.customerModel = customerModel;
    }

    async findByEmail(email) {
        const doc = await this.customerModel.findOne({ email }).lean();
        return CustomerMapper.toDomain(doc);
    }

    async findById(id) {
        const doc = await this.customerModel.findById(id).lean();
        return CustomerMapper.toDomain(doc);
    }

    async findOne(query) {
        const doc = await this.customerModel.findOne(query).lean();
        return CustomerMapper.toDomain(doc);
    }

    async create(customerEntity) {
        const persistenceData = CustomerMapper.toPersistence(customerEntity);
        const doc = await this.customerModel.create(persistenceData);
        return CustomerMapper.toDomain(doc);
    }

    async updateById(id, customerEntity) {
        const persistenceData = CustomerMapper.toPersistence(customerEntity);
        const doc = await this.customerModel.findByIdAndUpdate(id, persistenceData, { new: true }).lean();
        return CustomerMapper.toDomain(doc);
    }

    async deleteById(id) {
        await this.customerModel.findByIdAndDelete(id);
    }

    async countDocuments(filter = {}) {
        return await this.customerModel.countDocuments(filter);
    }

    async findAll(filter = {}, sort = { createdAt: -1 }) {
        const docs = await this.customerModel.find(filter).sort(sort).lean();
        return docs.map(doc => CustomerMapper.toDomain(doc));
    }
}

module.exports = CustomerRepository;
