import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IProductVariant {
    _id?: mongoose.Types.ObjectId;
    color: string;
    colorHex?: string;
    size: string;
    sku?: string;
    stock: number;
    additionalPrice: number;
}

export interface IProduct extends Document {
    name: string;
    slug: string;
    price: number;
    originalPrice?: number;
    discountPercent: number;
    stock?: number;             // Deprecated — dùng variants.stock thay thế
    description?: string;
    images: string[];
    category?: string;
    brand?: string;
    gender?: 'male' | 'female' | 'unisex' | 'kids';
    tags: string[];
    material?: string;
    variants: IProductVariant[];
    isActive: boolean;
    deletedAt?: Date | null;
    averageRating: number;
    reviewCount: number;
    soldCount: number;
    createdAt: Date;
    updatedAt: Date;
}

const VALID_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'One Size', 'Free Size'];

const productVariantSchema = new Schema({
    color: { type: String, required: true, trim: true },
    colorHex: { type: String, trim: true },
    size: {
        type: String,
        required: true,
        enum: VALID_SIZES
    },
    sku: {
        type: String,
        trim: true,
        uppercase: true,
        sparse: true    // unique chỉ áp dụng cho các giá trị non-null
    },
    stock: {
        type: Number,
        default: 0,
        min: [0, 'Tồn kho không được âm']
    },
    additionalPrice: {
        type: Number,
        default: 0,
        min: [0, 'Chênh lệch giá không được âm']
    }
}, { _id: true });

const productSchema: Schema = new Schema({
    name: {
        type: String,
        required: [true, 'Tên sản phẩm không được để trống'],
        trim: true
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true
    },
    price: {
        type: Number,
        required: [true, 'Giá sản phẩm là bắt buộc'],
        min: [0, 'Giá sản phẩm không được âm']
    },
    originalPrice: {
        type: Number,
        min: [0, 'Giá gốc không được âm']
    },
    discountPercent: {
        type: Number,
        default: 0,
        min: [0, 'Phần trăm giảm giá không được âm'],
        max: [100, 'Phần trăm giảm giá không được vượt quá 100']
    },
    description: {
        type: String,
        trim: true
    },
    images: [{ type: String }],
    category: {
        type: String,
        trim: true
    },
    brand: {
        type: String,
        trim: true
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'unisex', 'kids']
    },
    tags: [{ type: String, trim: true, lowercase: true }],
    material: { type: String, trim: true },
    variants: [productVariantSchema],
    isActive: {
        type: Boolean,
        default: true
    },
    deletedAt: {
        type: Date,
        default: null
    },
    // Denormalized stats — cập nhật bằng background job sau mỗi review/order
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
    soldCount: { type: Number, default: 0, min: 0 }
}, {
    timestamps: true
});

// ─── INDEXES ────────────────────────────────────────────────────────────────
productSchema.index({ name: 'text', description: 'text', brand: 'text', tags: 'text' }); // Full-text search
productSchema.index({ slug: 1 }, { unique: true, sparse: true });
productSchema.index({ category: 1, isActive: 1, price: 1 });
productSchema.index({ brand: 1, isActive: 1 });
productSchema.index({ gender: 1, isActive: 1 });
productSchema.index({ tags: 1 });
productSchema.index({ soldCount: -1 });       // Sản phẩm bán chạy
productSchema.index({ createdAt: -1 });       // Hàng mới về
productSchema.index({ discountPercent: -1 }); // Đang giảm giá
productSchema.index({ deletedAt: 1 });        // Soft delete filter
productSchema.index({ isActive: 1, deletedAt: 1 }); // Compound cho query cơ bản

const ProductModel: Model<IProduct> = mongoose.model<IProduct>('ProductEntity', productSchema);

export default ProductModel;
