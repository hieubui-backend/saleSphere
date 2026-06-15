import ProductEntity from '../../../domain/entities/ProductEntity';
import { IProductRepository } from '../../../domain/repositories/IProductRepository';
import RedisService from '../../../infrastructure/cache/RedisService';

export default class ProductUseCases {
    private productRepository: IProductRepository;
    private redisService: RedisService;

    constructor({ productRepository, redisService }: { productRepository: IProductRepository, redisService: RedisService }) {
        this.productRepository = productRepository;
        this.redisService = redisService;
    }

    public async getAllProducts(query: any = {}): Promise<ProductEntity[]> {
        const cacheKey = `products:all:${JSON.stringify(query)}`;
        const cachedData = await this.redisService.get(cacheKey);

        if (cachedData) {
            const parsed = JSON.parse(cachedData);
            return parsed.map((item: any) => new ProductEntity(item));
        }

        const products = await this.productRepository.findAll(query);
        
        // Lưu vào cache với Random TTL (1 tiếng)
        await this.redisService.setWithRandomTTL(cacheKey, JSON.stringify(products), 3600);
        
        return products;
    }

    public async getProductById(id: string): Promise<ProductEntity | null> {
        const cacheKey = `product:${id}`;
        const cachedData = await this.redisService.get(cacheKey);

        if (cachedData) {
            return new ProductEntity(JSON.parse(cachedData));
        }

        const product = await this.productRepository.findById(id);
        if (product) {
            await this.redisService.setWithRandomTTL(cacheKey, JSON.stringify(product), 3600);
        }
        
        return product;
    }

    public async createProduct(productData: any): Promise<ProductEntity | null> {
        const cleanData = {
            ...productData,
            name: productData.name ? productData.name.trim() : '',
            price: Number(productData.price) || 0,
            variants: productData.variants ?? [],
            images: productData.images && productData.images.length > 0
                ? productData.images
                : ['/images/default-product.png']
        };

        if (!cleanData.name) {
            throw new Error('Tên sản phẩm không được để trống');
        }

        const productEntity = new ProductEntity(cleanData);
        const newProduct = await this.productRepository.create(productEntity);
        
        if (newProduct) {
            await this.clearProductCache();
        }
        
        return newProduct;
    }

    public async updateProduct(id: string, updateData: any): Promise<ProductEntity | null> {
        const product = await this.productRepository.findById(id);
        if (!product) throw new Error('Sản phẩm không tồn tại');

        if (updateData.name) product.name = updateData.name.trim();
        if (updateData.price !== undefined) product.price = Number(updateData.price) || 0;
        if (updateData.variants !== undefined) product.variants = updateData.variants;
        if (updateData.brand !== undefined) product.brand = updateData.brand;
        if (updateData.category !== undefined) product.category = updateData.category;
        if (updateData.isActive !== undefined) product.isActive = updateData.isActive;

        const updatedProduct = await this.productRepository.updateById(id, product);
        
        if (updatedProduct) {
            await this.clearProductCache(id);
        }
        
        return updatedProduct;
    }

    public async deleteProduct(id: string): Promise<void> {
        await this.productRepository.deleteById(id);
        await this.clearProductCache(id);
    }

    private async clearProductCache(id?: string): Promise<void> {
        // Xóa danh sách và chi tiết sản phẩm cụ thể
        const keysToDel = ['products:all:*'];
        if (id) keysToDel.push(`product:${id}`);
        
        await this.redisService.clearPattern('products:all:*');
        if (id) await this.redisService.del(`product:${id}`);
    }
}





