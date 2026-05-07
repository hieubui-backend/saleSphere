class UserRepository {
    constructor({ userModel }) {
        this.userModel = userModel;
    }

    async findByEmail(email) {
        return await this.userModel.findOne({ email }).lean();
    }

    async findById(id) {
        return await this.userModel.findById(id).lean();
    }

    async create(userData) {
        const user = await this.userModel.create(userData);
        return user.toObject();
    }

    async countByTenantAndRole(tenantId, role) {
        const query = { role };
        if (tenantId) query.tenantId = tenantId;
        return await this.userModel.countDocuments(query);
    }

    async findByTenantAndRole(tenantId, role, skip, limit) {
        const query = { role };
        if (tenantId) query.tenantId = tenantId;
        
        return await this.userModel.find(query)
            .select('-password')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 })
            .lean();
    }

    async updateByIdAndTenant(id, tenantId, updateData) {
        return await this.userModel.findOneAndUpdate(
            { _id: id, tenantId },
            updateData,
            { new: true }
        ).select('-password').lean();
    }

    async deleteByIdAndTenant(id, tenantId) {
        return await this.userModel.findOneAndDelete({ _id: id, tenantId }).lean();
    }
}

module.exports = UserRepository;
