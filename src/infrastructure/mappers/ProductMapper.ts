import ProductEntity from '../../domain/entities/ProductEntity';

export default class ProductMapper {
    public static toDomain(doc: any): ProductEntity | null {
        if (!doc) return null;
        return new ProductEntity({
            id: doc._id.toString(),
            name: doc.name,
            price: doc.price,
            stock: doc.stock,
            description: doc.description,
            images: doc.images,
            category: doc.category,
            isActive: doc.isActive
        });
    }

    public static toPersistence(entity: ProductEntity): any {
        return {
            name: entity.name,
            price: entity.price,
            stock: entity.stock,
            description: entity.description,
            images: entity.images,
            category: entity.category,
            isActive: entity.isActive
        };
    }
}





