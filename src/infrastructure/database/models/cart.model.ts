import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ICart extends Document {
    customerId: mongoose.Types.ObjectId;
    items: {
        productId: mongoose.Types.ObjectId;
        quantity: number;
        price: number;
    }[];
    updatedAt: Date;
}

const cartSchema: Schema = new Schema({
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserEntity', required: true },
    items: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductEntity', required: true },
        quantity: { type: Number, default: 1, min: 1 },
        price: { type: Number, required: true }
    }]
}, { 
    timestamps: true 
});

const CartModel: Model<ICart> = mongoose.model<ICart>('CartEntity', cartSchema);

export default CartModel;





