import ProductEntity from '../entities/ProductEntity';

export interface IProductRepository {
    findById(id: string): Promise<ProductEntity | null>;
    findBySlug(slug: string): Promise<ProductEntity | null>;
    findAll(query?: any): Promise<ProductEntity[]>;
    create(productEntity: ProductEntity): Promise<ProductEntity | null>;
    updateById(id: string, productEntity: ProductEntity): Promise<ProductEntity | null>;
    decrementStock(id: string, quantity: number, variantId?: string, session?: any): Promise<boolean>;
    softDeleteById(id: string): Promise<void>;
    deleteById(id: string): Promise<void>;
    search(keyword: string, filters?: any): Promise<ProductEntity[]>;
    updateRatingStats(productId: string, averageRating: number, reviewCount: number): Promise<void>;
}
