class CartUseCases {
    constructor({ cartRepository, productModel, orderUseCases }) {
        this.cartRepository = cartRepository;
        this.Product = productModel;
        this.orderUseCases = orderUseCases;
    }

    async updateCartQuantity(customerId, productId, change) {
        const cart = await this.cartRepository.findByCustomerIdWithProduct(customerId);
        if (!cart) {
            throw new Error('Giỏ hàng không tồn tại');
        }

        const itemIndex = cart.items.findIndex(p => p.productId._id.toString() === productId);

        if (itemIndex > -1) {
            const product = cart.items[itemIndex].productId;
            const currentQty = cart.items[itemIndex].quantity;
            const newQty = currentQty + change;

            if (change > 0 && newQty > product.stock) {
                throw new Error(`Sản phẩm này chỉ còn ${product.stock} món trong kho`);
            }

            if (newQty <= 0) {
                cart.items.splice(itemIndex, 1);
            } else {
                cart.items[itemIndex].quantity = newQty;
            }

            cart.totalPrice = cart.items.reduce((total, item) => {
                return total + (item.quantity * item.productId.price);
            }, 0);

            await cart.save();
            return cart;
        }

        throw new Error('Sản phẩm không có trong giỏ');
    }

    async checkout(customerId, checkoutData = {}) {
        const cart = await this.cartRepository.findByCustomerId(customerId);
        if (!cart || cart.items.length === 0) {
            throw new Error('Giỏ hàng trống, không thể thanh toán');
        }

        const order = await this.orderUseCases.createOrder(customerId, { 
            items: cart.items,
            ...checkoutData 
        });
        
        await this.cartRepository.deleteByCustomerId(customerId);

        return order;
    }
}

module.exports = CartUseCases;
