import { Model } from 'mongoose';
import UserEntity from '../../domain/entities/UserEntity';
import UserMapper from '../mappers/UserMapper';
import { IUser } from '../database/models/user.model';

import { IUserRepository } from '../../domain/repositories/IUserRepository';

export default class UserRepository implements IUserRepository {
    private userModel: Model<IUser>;

    constructor({ userModel }: { userModel: Model<IUser> }) {
        this.userModel = userModel;
    }

    public async findByEmail(email: string): Promise<UserEntity | null> {
        const doc = await this.userModel.findOne({ email }).lean();
        return UserMapper.toDomain(doc);
    }

    public async findById(id: string): Promise<UserEntity | null> {
        const doc = await this.userModel.findById(id).lean();
        return UserMapper.toDomain(doc);
    }

    public async create(userEntity: UserEntity): Promise<UserEntity | null> {
        const persistenceData = UserMapper.toPersistence(userEntity);
        const doc = await this.userModel.create(persistenceData);
        return UserMapper.toDomain(doc);
    }

    public async countByRole(role: string): Promise<number> {
        return await this.userModel.countDocuments({ role });
    }

    public async findByRole(role: string, skip: number, limit: number): Promise<UserEntity[]> {
        const docs = await this.userModel.find({ role })
            .select('-password')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 })
            .lean();
        return docs.map(doc => UserMapper.toDomain(doc)!);
    }

    public async updateById(id: string, userEntity: UserEntity): Promise<UserEntity | null> {
        const persistenceData = UserMapper.toPersistence(userEntity);
        const doc = await this.userModel.findByIdAndUpdate(id, persistenceData, { new: true }).lean();
        return UserMapper.toDomain(doc);
    }

    public async deleteById(id: string): Promise<void> {
        await this.userModel.findByIdAndDelete(id);
    }
}





