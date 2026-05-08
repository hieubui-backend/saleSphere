const Customer = require('../../domain/entities/Customer');

class CustomerMapper {
    static toDomain(doc) {
        if (!doc) return null;
        return new Customer({
            id: doc._id,
            name: doc.name,
            email: doc.email,
            password: doc.password,
            phone: doc.phone,
            address: doc.address,
            isActive: doc.isActive
        });
    }

    static toPersistence(entity) {
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

module.exports = CustomerMapper;
