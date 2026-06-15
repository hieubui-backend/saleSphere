import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IReview extends Document {
    productId: mongoose.Types.ObjectId;
    customerId: mongoose.Types.ObjectId;
    orderId: mongoose.Types.ObjectId;
    rating: number;
    title?: string;
    content?: string;
    images: string[];
    variantInfo?: { color?: string; size?: string };
    isVerifiedPurchase: boolean;
    helpfulCount: number;
    status: 'pending' | 'approved' | 'rejected';
    adminReply?: string;
    createdAt: Date;
    updatedAt: Date;
}

const reviewSchema: Schema = new Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductEntity',
        required: true
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CustomerEntity',
        required: true
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'OrderEntity',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: [1, 'Đánh giá tối thiểu là 1 sao'],
        max: [5, 'Đánh giá tối đa là 5 sao']
    },
    title: { type: String, trim: true, maxlength: 100 },
    content: { type: String, trim: true, maxlength: 2000 },
    images: [{ type: String }],
    // Snapshot màu/size đã mua để người đọc biết context
    variantInfo: {
        color: { type: String },
        size: { type: String }
    },
    isVerifiedPurchase: { type: Boolean, default: true },
    helpfulCount: { type: Number, default: 0, min: 0 },
    // Admin phải duyệt trước khi review hiển thị công khai
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    adminReply: { type: String, trim: true }
}, {
    timestamps: true
});

// ─── INDEXES ────────────────────────────────────────────────────────────────
reviewSchema.index({ productId: 1, status: 1, createdAt: -1 }); // Load reviews của sản phẩm
reviewSchema.index({ customerId: 1, createdAt: -1 });           // Reviews của customer
reviewSchema.index({ orderId: 1 }, { unique: true });            // Mỗi đơn chỉ review 1 lần
reviewSchema.index({ rating: 1, productId: 1 });                 // Filter theo sao
reviewSchema.index({ status: 1 });                               // Admin duyệt

const ReviewModel: Model<IReview> = mongoose.model<IReview>('ReviewEntity', reviewSchema);

export default ReviewModel;
