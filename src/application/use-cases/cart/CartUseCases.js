const { Cart } = require('../../../domain/entities/Cart');

class CartUseCases {
    constructor({ cartRepository, productRepository, orderUseCases }) {
        this.cartRepository = cartRepository;
        this.productRepository = productRepository;
        this.orderUseCases = orderUseCases;
    }

    async addToCart(customerId, { productId, quantity = 1 }) {
        let cartEntity = await this.cartRepository.findByCustomerId(customerId);
        if (!cartEntity) {
            cartEntity = new Cart({ customerId, items: [] });
        }

        const productEntity = await this.productRepository.findById(productId);
        if (!productEntity) throw new Error('Sản phẩm không tồn tại');

        if (productEntity.stock < quantity) throw new Error('Sản phẩm không đủ hàng');

        cartEntity.addItem(productEntity, quantity);
        return await this.cartRepository.save(cartEntity);
    }

    async updateCartQuantity(customerId, productId, quantity) {
        const cartEntity = await this.cartRepository.findByCustomerId(customerId);
        if (!cartEntity) throw new Error('Giỏ hàng không tồn tại');

        const productEntity = await this.productRepository.findById(productId);
        if (!productEntity) throw new Error('Sản phẩm không tồn tại');

        if (quantity > productEntity.stock) {
            throw new Error(`Sản phẩm này chỉ còn ${productEntity.stock} món trong kho`);
        }

        if (quantity <= 0) {
            cartEntity.removeItem(productId);
        } else {
            cartEntity.updateItemQuantity(productId, quantity);
        }

        return await this.cartRepository.save(cartEntity);
    }

    async checkout(customerId, checkoutData = {}) {
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

module.exports = CartUseCases;
