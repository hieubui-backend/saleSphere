class ProductRepository {
    constructor({ productModel }) {
        this.productModel = productModel;
    }

    findOne(query, options = {}) {
        return this.productModel.findOne(query, null, options);
    }

    findById(id, options = {}) {
        return this.productModel.findById(id, null, options);
    }

    find(query, options = {}) {
        return this.productModel.find(query, null, options);
    }

    updateOne(query, update, options = {}) {
        return this.productModel.updateOne(query, update, options);
    }

    findByIdAndUpdate(id, update, options = {}) {
        return this.productModel.findByIdAndUpdate(id, update, options);
    }

    async countDocuments(query = {}) {
        return await this.productModel.countDocuments(query);
    }

    async findByTenant(tenantId, { page = 1, limit = 10, search } = {}) {
        const query = { tenantId, isActive: true };
        if (search) query.name = { $regex: search, $options: 'i' };

        const products = await this.productModel.find(query)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 })
            .lean();

        const count = await this.productModel.countDocuments(query);
        return { products, count };
    }

    findByIdAndTenant(id, tenantId) {
        return this.productModel.findOne({ _id: id, tenantId });
    }

    async create(productData) {
        const product = new this.productModel(productData);
        return await product.save();
    }

    updateByIdAndTenant(id, tenantId, updateData) {
        return this.productModel.findOneAndUpdate(
            { _id: id, tenantId },
            updateData,
            { new: true, runValidators: true }
        );
    }

    deleteByIdAndTenant(id, tenantId) {
        return this.productModel.findOneAndDelete({ _id: id, tenantId });
    }

    updateStock(productId, quantityChange, session = null) {
        const opts = session ? { session } : {};
        return this.productModel.findByIdAndUpdate(
            productId,
            { $inc: { stock: quantityChange } },
            opts
        );
    }
}

module.exports = ProductRepository;
