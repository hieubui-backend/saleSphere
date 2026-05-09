import ProductEntity from '../../../domain/entities/ProductEntity';
import { IProductRepository } from '../../../domain/repositories/IProductRepository';

export default class ProductUseCases {
    private productRepository: IProductRepository;

    constructor({ productRepository }: { productRepository: IProductRepository }) {
        this.productRepository = productRepository;
    }

    public async getAllProducts(query: any = {}): Promise<ProductEntity[]> {
        return await this.productRepository.findAll(query);
    }

    public async getProductById(id: string): Promise<ProductEntity | null> {
        return await this.productRepository.findById(id);
    }

    public async createProduct(productData: any): Promise<ProductEntity | null> {
        const cleanData = {
            ...productData,
            name: productData.name ? productData.name.trim() : "",
            price: Number(productData.price) || 0,
            stock: Number(productData.stock) || 0,
            images: productData.images && productData.images.length > 0 
                    ? productData.images 
                    : ['/images/default-product.png']
        };

        if (!cleanData.name) {
            throw new Error('Tên sản phẩm không được để trống');
        }

        const productEntity = new ProductEntity(cleanData);
        return await this.productRepository.create(productEntity);
    }

    public async updateProduct(id: string, updateData: any): Promise<ProductEntity | null> {
        const product = await this.productRepository.findById(id);
        if (!product) throw new Error('Sản phẩm không tồn tại');

        if (updateData.name) product.name = updateData.name.trim();
        if (updateData.price !== undefined) product.price = Number(updateData.price) || 0;
        if (updateData.stock !== undefined) product.stock = Number(updateData.stock) || 0;

        return await this.productRepository.updateById(id, product);
    }

    public async deleteProduct(id: string): Promise<void> {
        return await this.productRepository.deleteById(id);
    }
}





