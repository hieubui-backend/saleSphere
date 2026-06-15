import CustomerEntity from '../../domain/entities/CustomerEntity';

export default class CustomerMapper {
    public static toDomain(doc: any): CustomerEntity | null {
        if (!doc) return null;
        return new CustomerEntity({
            id: doc._id.toString(),
            name: doc.name,
            email: doc.email,
            password: doc.password,
            phone: doc.phone,
            avatar: doc.avatar,
            gender: doc.gender,
            dateOfBirth: doc.dateOfBirth,
            addresses: doc.addresses ?? [],
            isActive: doc.isActive
        });
    }

    public static toPersistence(entity: CustomerEntity): any {
        return {
            name: entity.name,
            email: entity.email,
            password: entity.password,
            phone: entity.phone,
            avatar: entity.avatar,
            gender: entity.gender,
            dateOfBirth: entity.dateOfBirth,
            addresses: entity.addresses,
            isActive: entity.isActive
        };
    }
}
