import UserEntity from '../../domain/entities/UserEntity';

export default class UserMapper {
    public static toDomain(doc: any): UserEntity | null {
        if (!doc) return null;
        return new UserEntity({
            id: doc._id.toString(),
            name: doc.name,
            email: doc.email,
            password: doc.password,
            role: doc.role,
            isActive: doc.isActive
        });
    }

    public static toPersistence(entity: UserEntity): any {
        return {
            name: entity.name,
            email: entity.email,
            password: entity.password,
            role: entity.role,
            isActive: entity.isActive
        };
    }
}





