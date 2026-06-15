import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ICartItem {
    productId: mongoose.Types.ObjectId;
    variantId?: mongoose.Types.ObjectId; // ID của variant cụ thể
    color?: string;   // Snapshot để hiển thị nhanh
    size?: string;    // Snapshot để hiển thị nhanh
    sku?: string;
    quantity: number;
    price: number;    // Snapshot giá tại thời điểm thêm vào giỏ
}

export interface ICart extends Document {
    customerId: mongoose.Types.ObjectId;
    items: ICartItem[];
    updatedAt: Date;
}

const cartSchema: Schema = new Schema({
    // FIX: ref đúng 'CustomerEntity' (trước đây là 'UserEntity' — BUG)
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CustomerEntity',
        required: true,
        index: true
    },
    items: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ProductEntity',
            required: true
        },
        variantId: {
            type: mongoose.Schema.Types.ObjectId,
            required: false
        },
        // Snapshot thông tin variant để hiển thị nhanh (không cần populate)
        color: { type: String, trim: true },
        size: { type: String, trim: true },
        sku: { type: String, trim: true },
        quantity: {
            type: Number,
            default: 1,
            min: [1, 'Số lượng trong giỏ phải ít nhất là 1']
        },
        price: {
            type: Number,
            required: true,
            min: [0, 'Giá không được âm']
        }
    }]
}, {
    timestamps: true
});

// Mỗi Customer chỉ có duy nhất 1 giỏ hàng
cartSchema.index({ customerId: 1 }, { unique: true });

const CartModel: Model<ICart> = mongoose.model<ICart>('CartEntity', cartSchema);

export default CartModel;
