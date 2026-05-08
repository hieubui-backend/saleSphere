const User = require('../../domain/entities/User');

class UserMapper {
    static toDomain(doc) {
        if (!doc) return null;
        return new User({
            id: doc._id,
            name: doc.name,
            email: doc.email,
            password: doc.password,
            role: doc.role,
            isActive: doc.isActive
        });
    }

    static toPersistence(entity) {
        return {
            name: entity.name,
            email: entity.email,
            password: entity.password,
            role: entity.role,
            isActive: entity.isActive
        };
    }
}

module.exports = UserMapper;
