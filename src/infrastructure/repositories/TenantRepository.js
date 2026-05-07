class TenantRepository {
    constructor({ tenantModel }) {
        this.tenantModel = tenantModel;
    }

    findByEmailOrSlug(email, slug) {
        return this.tenantModel.findOne({ $or: [{ email }, { slug }] });
    }

    findById(id) {
        return this.tenantModel.findById(id);
    }

    findOne(query) {
        return this.tenantModel.findOne(query);
    }

    async findAll(filter = {}, sort = { createdAt: -1 }) {
        return await this.tenantModel.find(filter).sort(sort).lean();
    }

    find(filter = {}) {
        return this.tenantModel.find(filter);
    }

    async create(tenantData) {
        const tenant = new this.tenantModel(tenantData);
        return await tenant.save();
    }

    updateById(id, updateData) {
        return this.tenantModel.findByIdAndUpdate(
            id, updateData, { new: true, runValidators: true }
        );
    }

    async deleteById(id) {
        return await this.tenantModel.findByIdAndDelete(id);
    }

    async countDocuments(filter = {}) {
        return await this.tenantModel.countDocuments(filter);
    }

    async count(filter = {}) {
        return await this.tenantModel.countDocuments(filter);
    }
}

module.exports = TenantRepository;
