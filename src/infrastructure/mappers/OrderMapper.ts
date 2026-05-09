import OrderEntity from '../../domain/entities/OrderEntity';

export default class OrderMapper {
    public static toDomain(doc: any): OrderEntity | null {
        if (!doc) return null;
        
        const order = new OrderEntity({
            customerId: doc.customerId.toString(),
            shippingAddress: doc.shippingAddress,
            region: doc.region,
            paymentMethod: doc.paymentMethod,
            items: doc.items.map((i: any) => ({
                product: (i.productId || i.product).toString(),
                name: i.name,
                price: i.price,
                quantity: i.quantity
            })),
            subtotal: doc.subtotal,
            shippingFee: doc.shippingFee,
            totalAmount: doc.totalAmount,
            status: doc.status,
            paymentStatus: doc.paymentStatus
        });
        
        order.id = doc._id.toString();
        
        return order;
    }

    public static toPersistence(entity: OrderEntity): any {
        return {
            customerId: entity.customerId,
            userId: entity.customerId, // Hỗ trợ backward compatibility
            items: entity.items.map(i => ({
                product: i.product,
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





