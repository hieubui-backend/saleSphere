const Product = require('../../domain/entities/Product');

class ProductMapper {
    static toDomain(doc) {
        if (!doc) return null;
        return new Product({
            id: doc._id,
            name: doc.name,
            price: doc.price,
            stock: doc.stock
        });
    }

    static toPersistence(entity) {
        return {
            name: entity.name,
            price: entity.price,
            stock: entity.stock
        };
    }
}

module.exports = ProductMapper;
