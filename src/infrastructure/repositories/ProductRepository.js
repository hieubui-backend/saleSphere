const ProductMapper = require('../mappers/ProductMapper');

class ProductRepository {
    constructor({ productModel }) {
        this.productModel = productModel;
    }

    async findById(id) {
        const doc = await this.productModel.findById(id).lean();
        return ProductMapper.toDomain(doc);
    }

    async findAll(query = {}) {
        const docs = await this.productModel.find(query).sort({ createdAt: -1 }).lean();
        return docs.map(doc => ProductMapper.toDomain(doc));
    }

    async create(productEntity) {
        const persistenceData = ProductMapper.toPersistence(productEntity);
        const doc = await this.productModel.create(persistenceData);
        return ProductMapper.toDomain(doc);
    }

    async updateById(id, productEntity) {
        const persistenceData = ProductMapper.toPersistence(productEntity);
        const doc = await this.productModel.findByIdAndUpdate(
            id,
            { $set: persistenceData },
            { new: true }
        ).lean();
        return ProductMapper.toDomain(doc);
    }

    async deleteById(id) {
        await this.productModel.findByIdAndDelete(id);
    }

    async search(keyword) {
        const docs = await this.productModel.find({
            name: { $regex: keyword, $options: 'i' }
        }).lean();
        return docs.map(doc => ProductMapper.toDomain(doc));
    }
}

module.exports = ProductRepository;
