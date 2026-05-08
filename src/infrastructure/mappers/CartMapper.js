const { Cart } = require('../../domain/entities/Cart');

class CartMapper {
    static toDomain(doc) {
        if (!doc) return null;
        return new Cart({
            id: doc._id,
            customerId: doc.customerId,
            items: doc.items.map(i => ({
                productId: i.productId || i.product, // Hỗ trợ cả 2 schema cũ/mới
                name: i.name,
                price: i.price,
                quantity: i.quantity
            }))
        });
    }

    static toPersistence(entity) {
        return {
            customerId: entity.customerId,
            items: entity.items.map(i => ({
                product: i.productId,
                productId: i.productId,
                name: i.name,
                price: i.price,
                quantity: i.quantity
            }))
        };
    }
}

module.exports = CartMapper;
