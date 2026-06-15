import { CartEntity } from '../../../domain/entities/CartEntity';
import { ICartRepository } from '../../../domain/repositories/ICartRepository';
import { IProductRepository } from '../../../domain/repositories/IProductRepository';
import OrderUseCases from '../order/OrderUseCases';

export default class CartUseCases {
    private cartRepository: ICartRepository;
    private productRepository: IProductRepository;
    private orderUseCases: OrderUseCases;

    constructor({ cartRepository, productRepository, orderUseCases }: { 
        cartRepository: ICartRepository, 
        productRepository: IProductRepository, 
        orderUseCases: OrderUseCases 
    }) {
        this.cartRepository = cartRepository;
        this.productRepository = productRepository;
        this.orderUseCases = orderUseCases;
    }

    public async addToCart(customerId: string, { productId, quantity = 1 }: { productId: string, quantity?: number }): Promise<CartEntity | null> {
        let cartEntity = await this.cartRepository.findByCustomerId(customerId);
        if (!cartEntity) {
            cartEntity = new CartEntity({ customerId, items: [] });
        }

        const productEntity = await this.productRepository.findById(productId);
        if (!productEntity) throw new Error('Sản phẩm không tồn tại');

        if (productEntity.getTotalStock() < quantity) throw new Error('Sản phẩm không đủ hàng');

        cartEntity.addItem(productEntity as any, quantity);
        return await this.cartRepository.save(cartEntity);
    }

    public async updateCartQuantity(customerId: string, productId: string, quantity: number): Promise<CartEntity | null> {
        const cartEntity = await this.cartRepository.findByCustomerId(customerId);
        if (!cartEntity) throw new Error('Giỏ hàng không tồn tại');

        const productEntity = await this.productRepository.findById(productId);
        if (!productEntity) throw new Error('Sản phẩm không tồn tại');

        const availableStock = productEntity.getTotalStock();
        if (quantity > availableStock) {
            throw new Error(`Sản phẩm này chỉ còn ${availableStock} món trong kho`);
        }

        if (quantity <= 0) {
            cartEntity.removeItem(productId);
        } else {
            cartEntity.updateItemQuantity(productId, quantity);
        }

        return await this.cartRepository.save(cartEntity);
    }

    public async removeFromCart(customerId: string, productId: string): Promise<CartEntity | null> {
        const cartEntity = await this.cartRepository.findByCustomerId(customerId);
        if (!cartEntity) throw new Error('Giỏ hàng không tồn tại');

        cartEntity.removeItem(productId);

        return await this.cartRepository.save(cartEntity);
    }

    public async checkout(customerId: string, checkoutData: any = {}): Promise<any> {
        const cartEntity = await this.cartRepository.findByCustomerId(customerId);
        if (!cartEntity || cartEntity.items.length === 0) {
            throw new Error('Giỏ hàng trống, không thể thanh toán');
        }

        const order = await this.orderUseCases.createOrder(customerId, { 
            items: cartEntity.items.map(i => ({ product: i.productId, quantity: i.quantity })),
            ...checkoutData 
        });
        
        await this.cartRepository.deleteByCustomerId(customerId);

        return order;
    }
}
