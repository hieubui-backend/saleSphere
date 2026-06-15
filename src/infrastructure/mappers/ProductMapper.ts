import ProductEntity from '../../domain/entities/ProductEntity';

export default class ProductMapper {
    public static toDomain(doc: any): ProductEntity | null {
        if (!doc) return null;
        return new ProductEntity({
            id: doc._id.toString(),
            name: doc.name,
            slug: doc.slug,
            price: doc.price,
            originalPrice: doc.originalPrice,
            discountPercent: doc.discountPercent ?? 0,
            description: doc.description,
            images: doc.images ?? [],
            category: doc.category,
            brand: doc.brand,
            gender: doc.gender,
            tags: doc.tags ?? [],
            material: doc.material,
            variants: doc.variants ?? [],
            isActive: doc.isActive,
            deletedAt: doc.deletedAt ?? null,
            averageRating: doc.averageRating ?? 0,
            reviewCount: doc.reviewCount ?? 0,
            soldCount: doc.soldCount ?? 0,
        });
    }

    public static toPersistence(entity: ProductEntity): any {
        return {
            name: entity.name,
            slug: entity.slug,
            price: entity.price,
            originalPrice: entity.originalPrice,
            discountPercent: entity.discountPercent,
            description: entity.description,
            images: entity.images,
            category: entity.category,
            brand: entity.brand,
            gender: entity.gender,
            tags: entity.tags,
            material: entity.material,
            variants: entity.variants,
            isActive: entity.isActive,
            deletedAt: entity.deletedAt,
            averageRating: entity.averageRating,
            reviewCount: entity.reviewCount,
            soldCount: entity.soldCount,
        };
    }
}
