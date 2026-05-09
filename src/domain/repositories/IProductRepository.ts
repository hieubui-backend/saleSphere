import ProductEntity from '../entities/ProductEntity';

export interface IProductRepository {
    findById(id: string): Promise<ProductEntity | null>;
    findAll(query?: any): Promise<ProductEntity[]>;
    create(productEntity: ProductEntity): Promise<ProductEntity | null>;
    updateById(id: string, productEntity: ProductEntity): Promise<ProductEntity | null>;
    deleteById(id: string): Promise<void>;
    search(keyword: string): Promise<ProductEntity[]>;
}
