class CartRepository {
    constructor({ cartModel }) {
        this.cartModel = cartModel;
    }

    async findByCustomerId(customerId) {
        return await this.cartModel.findOne({ customerId });
    }

    async findByCustomerIdWithProduct(customerId) {
        return await this.cartModel.findOne({ customerId }).populate('items.productId');
    }

    async create(data) {
        const cart = new this.cartModel(data);
        return await cart.save();
    }

    async deleteByCustomerId(customerId) {
        return await this.cartModel.deleteOne({ customerId });
    }
}

module.exports = CartRepository;
