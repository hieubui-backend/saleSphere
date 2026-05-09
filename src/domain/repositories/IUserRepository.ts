import UserEntity from '../entities/UserEntity';

export interface IUserRepository {
    findByEmail(email: string): Promise<UserEntity | null>;
    findById(id: string): Promise<UserEntity | null>;
    create(userEntity: UserEntity): Promise<UserEntity | null>;
    countByRole(role: string): Promise<number>;
    findByRole(role: string, skip: number, limit: number): Promise<UserEntity[]>;
    updateById(id: string, userEntity: UserEntity): Promise<UserEntity | null>;
    deleteById(id: string): Promise<void>;
}
