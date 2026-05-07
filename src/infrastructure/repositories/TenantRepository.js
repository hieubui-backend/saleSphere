class TenantRepository {
    constructor({ tenantModel }) {
        this.tenantModel = tenantModel;
    }

    async findByEmailOrSlug(email, slug) {
        return await this.tenantModel.findOne({ $or: [{ email }, { slug }] });
    }

    async findById(id) {
        return await this.tenantModel.findById(id);
    }

    async findAll(filter = {}, sort = { createdAt: -1 }) {
        return await this.tenantModel.find(filter).sort(sort).lean();
    }

    async create(tenantData) {
        const tenant = new this.tenantModel(tenantData);
        return await tenant.save();
    }

    async updateById(id, updateData) {
        return await this.tenantModel.findByIdAndUpdate(
            id, updateData, { new: true, runValidators: true }
        );
    }

    async deleteById(id) {
        return await this.tenantModel.findByIdAndDelete(id);
    }

    async count(filter = {}) {
        return await this.tenantModel.countDocuments(filter);
    }
}

module.exports = TenantRepository;
