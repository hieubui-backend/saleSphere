const UserMapper = require('../mappers/UserMapper');

class UserRepository {
    constructor({ userModel }) {
        this.userModel = userModel;
    }

    async findByEmail(email) {
        const doc = await this.userModel.findOne({ email }).lean();
        return UserMapper.toDomain(doc);
    }

    async findById(id) {
        const doc = await this.userModel.findById(id).lean();
        return UserMapper.toDomain(doc);
    }

    async create(userEntity) {
        const persistenceData = UserMapper.toPersistence(userEntity);
        const doc = await this.userModel.create(persistenceData);
        return UserMapper.toDomain(doc);
    }

    async countByRole(role) {
        return await this.userModel.countDocuments({ role });
    }

    async findByRole(role, skip, limit) {
        const docs = await this.userModel.find({ role })
            .select('-password')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 })
            .lean();
        return docs.map(doc => UserMapper.toDomain(doc));
    }

    async updateById(id, userEntity) {
        const persistenceData = UserMapper.toPersistence(userEntity);
        const doc = await this.userModel.findByIdAndUpdate(id, persistenceData, { new: true }).lean();
        return UserMapper.toDomain(doc);
    }

    async deleteById(id) {
        await this.userModel.findByIdAndDelete(id);
    }
}

module.exports = UserRepository;
