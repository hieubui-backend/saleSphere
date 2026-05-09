import { Model } from 'mongoose';
import { CartEntity } from '../../domain/entities/CartEntity';
import CartMapper from '../mappers/CartMapper';
import { ICart } from '../database/models/cart.model';

import { ICartRepository } from '../../domain/repositories/ICartRepository';

export default class CartRepository implements ICartRepository {
    private cartModel: Model<ICart>;

    constructor({ cartModel }: { cartModel: Model<ICart> }) {
        this.cartModel = cartModel;
    }

    public async findByCustomerId(customerId: string): Promise<CartEntity | null> {
        const doc = await this.cartModel.findOne({ customerId }).lean();
        return CartMapper.toDomain(doc);
    }

    public async save(cartEntity: CartEntity): Promise<CartEntity | null> {
        const persistenceData = CartMapper.toPersistence(cartEntity);
        
        const doc = await this.cartModel.findOneAndUpdate(
            { customerId: cartEntity.customerId },
            { $set: persistenceData },
            { new: true, upsert: true }
        ).lean();
        
        return CartMapper.toDomain(doc);
    }

    public async deleteByCustomerId(customerId: string): Promise<void> {
        await this.cartModel.findOneAndDelete({ customerId });
    }
}





