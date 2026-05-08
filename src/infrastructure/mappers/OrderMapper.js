const Order = require('../../domain/entities/Order');

class OrderMapper {
    static toDomain(doc) {
        if (!doc) return null;
        
        const order = new Order({
            customerId: doc.customerId,
            shippingAddress: doc.shippingAddress,
            region: doc.region,
            paymentMethod: doc.paymentMethod
        });
        
        order.id = doc._id;
        order.status = doc.status;
        order.paymentStatus = doc.paymentStatus;
        order.subtotal = doc.subtotal;
        order.shippingFee = doc.shippingFee;
        order.totalAmount = doc.totalAmount;
        
        order.items = doc.items.map(i => ({
            productId: i.productId || i.product,
            name: i.name,
            price: i.price,
            quantity: i.quantity
        }));
        
        return order;
    }

    static toPersistence(entity) {
        return {
            customerId: entity.customerId,
            userId: entity.customerId, // Hỗ trợ backward compatibility
            items: entity.items.map(i => ({
                product: i.productId,
                name: i.name,
                price: i.price,
                quantity: i.quantity
            })),
            subtotal: entity.subtotal,
            shippingFee: entity.shippingFee,
            totalAmount: entity.totalAmount,
            paymentMethod: entity.paymentMethod,
            paymentStatus: entity.paymentStatus,
            shippingAddress: entity.shippingAddress,
            region: entity.region,
            status: entity.status
        };
    }
}

module.exports = OrderMapper;
