class ProductRepository {
    constructor({ productModel }) {
        this.productModel = productModel;
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

    async findByIdAndTenant(id, tenantId) {
        return await this.productModel.findOne({ _id: id, tenantId });
    }

    async create(productData) {
        const product = new this.productModel(productData);
        return await product.save();
    }

    async updateByIdAndTenant(id, tenantId, updateData) {
        return await this.productModel.findOneAndUpdate(
            { _id: id, tenantId },
            updateData,
            { new: true, runValidators: true }
        );
    }

    async deleteByIdAndTenant(id, tenantId) {
        return await this.productModel.findOneAndDelete({ _id: id, tenantId });
    }

    async countByFilter(filter = {}) {
        return await this.productModel.countDocuments(filter);
    }

    async updateStock(productId, quantityChange, session = null) {
        const opts = session ? { session } : {};
        return await this.productModel.findByIdAndUpdate(
            productId,
            { $inc: { stock: quantityChange } },
            opts
        );
    }
}

module.exports = ProductRepository;
