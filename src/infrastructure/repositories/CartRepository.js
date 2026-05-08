const CartMapper = require('../mappers/CartMapper');

class CartRepository {
    constructor({ cartModel }) {
        this.cartModel = cartModel;
    }

    async findByCustomerId(customerId) {
        const doc = await this.cartModel.findOne({ customerId }).lean();
        return CartMapper.toDomain(doc);
    }

    async save(cartEntity) {
        const persistenceData = CartMapper.toPersistence(cartEntity);
        
        // Cập nhật hoặc tạo mới dựa trên customerId
        const doc = await this.cartModel.findOneAndUpdate(
            { customerId: cartEntity.customerId },
            { $set: persistenceData },
            { new: true, upsert: true }
        ).lean();
        
        return CartMapper.toDomain(doc);
    }

    async deleteByCustomerId(customerId) {
        await this.cartModel.findOneAndDelete({ customerId });
    }
}

module.exports = CartRepository;
