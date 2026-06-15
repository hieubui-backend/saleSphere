import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ICoupon extends Document {
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
    minOrderAmount: number;
    maxDiscountAmount?: number;
    usageLimit?: number;
    usedCount: number;
    perUserLimit: number;
    applicableProducts: mongoose.Types.ObjectId[];
    applicableCategories: string[];
    startDate: Date;
    endDate: Date;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const couponSchema: Schema = new Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true,
        maxlength: 30
    },
    type: {
        type: String,
        enum: ['percentage', 'fixed'],
        required: true
    },
    value: {
        type: Number,
        required: true,
        min: [0, 'Giá trị coupon không được âm']
    },
    // Đơn hàng tối thiểu để áp dụng (VNĐ)
    minOrderAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    // Số tiền giảm tối đa (áp dụng khi type = 'percentage', tránh giảm quá nhiều)
    maxDiscountAmount: {
        type: Number,
        min: 0
    },
    usageLimit: {
        type: Number,
        min: 1
    },
    usedCount: {
        type: Number,
        default: 0,
        min: 0
    },
    // Mỗi user được dùng tối đa N lần
    perUserLimit: {
        type: Number,
        default: 1,
        min: 1
    },
    // Để trống = áp dụng cho tất cả sản phẩm
    applicableProducts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductEntity'
    }],
    applicableCategories: [{ type: String, trim: true }],
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true }
}, {
    timestamps: true
});

// Validate logic: percentage value phải <= 100
couponSchema.pre('save', function (next) {
    if (this.type === 'percentage' && (this.value as number) > 100) {
        return next(new Error('Coupon theo % không được vượt quá 100'));
    }
    next();
});

// ─── INDEXES ────────────────────────────────────────────────────────────────
couponSchema.index({ code: 1 }, { unique: true });
couponSchema.index({ endDate: 1, isActive: 1 });    // Lọc coupon còn hiệu lực
couponSchema.index({ startDate: 1, endDate: 1 });   // Flash sale theo thời gian

const CouponModel: Model<ICoupon> = mongoose.model<ICoupon>('CouponEntity', couponSchema);

export default CouponModel;
