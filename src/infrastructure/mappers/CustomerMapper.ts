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
            address: doc.address,
            isActive: doc.isActive
        });
    }

    public static toPersistence(entity: CustomerEntity): any {
        return {
            name: entity.name,
            email: entity.email,
            password: entity.password,
            phone: entity.phone,
            address: entity.address,
            isActive: entity.isActive
        };
    }
}





