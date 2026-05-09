import { CartEntity } from '../../domain/entities/CartEntity';

export default class CartMapper {
    public static toDomain(doc: any): CartEntity | null {
        if (!doc) return null;
        return new CartEntity({
            id: doc._id.toString(),
            customerId: doc.customerId.toString(),
            items: doc.items.map((i: any) => ({
                productId: (i.productId || i.product).toString(),
                name: i.name,
                price: i.price,
                quantity: i.quantity
            }))
        });
    }

    public static toPersistence(entity: CartEntity): any {
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





