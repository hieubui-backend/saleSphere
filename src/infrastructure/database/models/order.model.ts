import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IOrderShippingAddress {
    recipientName: string;
    phone: string;
    street: string;
    ward: string;
    district: string;
    province: string;
    fullAddress?: string;
}

export interface IOrderItem {
    product: mongoose.Types.ObjectId;
    name: string;
    quantity: number;
    price: number;
    variantInfo?: {
        color?: string;
        size?: string;
        sku?: string;
    };
}

export interface IOrder extends Document {
    customerId?: mongoose.Types.ObjectId;
    userId?: mongoose.Types.ObjectId;
    items: IOrderItem[];
    subtotal: number;
    shippingFee: number;
    discountAmount: number;
    totalAmount: number;
    couponCode?: string;
    paymentMethod: 'vnpay' | 'momo' | 'cod' | 'bank_transfer';
    paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
    shippingAddress?: IOrderShippingAddress;
    region: string;
    status: string;
    shippingPartner: string;
    trackingNumber: string;
    note?: string;
    cancelReason?: string;
    cancelledAt?: Date;
    dispute: {
        isDisputed: boolean;
        type: 'return_refund' | 'refund_only';
        reason?: string;
        description?: string;
        images: string[];
        status: 'pending' | 'accepted' | 'rejected' | 'processing' | 'resolved';
        response?: string;
        imagesResponse: string[];
        returnTrackingNumber: string;
        returnShippingPartner: string;
        finalVerdict?: string;
        escalatedAt?: Date;
        requestedAt: Date;
        resolvedAt?: Date;
    };
    adminNote: string;
    updatedBy: string;
    processedAt?: Date;
    deletedAt?: Date | null;
    orderCode?: number;
    paymentTransactionId?: string;
    createdAt: Date;
    updatedAt: Date;
}

const orderShippingAddressSchema = new Schema({
    recipientName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    street: { type: String, required: true, trim: true },
    ward: { type: String, required: true, trim: true },
    district: { type: String, required: true, trim: true },
    province: { type: String, required: true, trim: true },
    fullAddress: { type: String, trim: true }
}, { _id: false });

const orderSchema: Schema = new Schema({
    // FIX: customerId → ref đúng 'CustomerEntity' (trước đây là 'UserEntity' — BUG)
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CustomerEntity',
        required: false
    },
    // userId: Admin/Staff tạo đơn thay (ref đúng là UserEntity)
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserEntity',
        required: false
    },

    items: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductEntity', required: true },
        name: { type: String, required: true },
        quantity: {
            type: Number,
            required: true,
            min: [1, 'Số lượng phải ít nhất là 1']
        },
        price: {
            type: Number,
            required: true,
            min: [0, 'Giá không được âm']
        },
        // Snapshot variant tại thời điểm đặt hàng (bất biến)
        variantInfo: {
            color: { type: String },
            size: { type: String },
            sku: { type: String }
        }
    }],

    subtotal: { type: Number, required: true, default: 0, min: 0 },
    shippingFee: { type: Number, required: true, default: 0, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    couponCode: { type: String, trim: true, uppercase: true },

    paymentMethod: {
        type: String,
        enum: ['vnpay', 'momo', 'cod', 'bank_transfer'],
        default: 'cod'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending'
    },

    // Địa chỉ giao hàng có cấu trúc (snapshot tại thời điểm đặt hàng)
    shippingAddress: { type: orderShippingAddressSchema },
    region: { type: String, default: 'DEFAULT' },

    status: {
        type: String,
        enum: [
            'pending', 'processing', 'shipping', 'completed',
            'cancelled', 'failed', 'returned', 'dispute_escalated'
        ],
        default: 'pending'
    },

    shippingPartner: { type: String, default: 'N/A' },
    trackingNumber: { type: String, default: '' },

    note: { type: String, trim: true },
    cancelReason: { type: String, trim: true },
    cancelledAt: { type: Date },

    dispute: {
        isDisputed: { type: Boolean, default: false },
        type: { type: String, enum: ['return_refund', 'refund_only'], default: 'return_refund' },
        reason: { type: String },
        description: { type: String },
        images: [{ type: String }],
        status: {
            type: String,
            enum: ['pending', 'accepted', 'rejected', 'processing', 'resolved'],
            default: 'pending'
        },
        response: { type: String },
        imagesResponse: [{ type: String }],
        returnTrackingNumber: { type: String, default: '' },
        returnShippingPartner: { type: String, default: '' },
        finalVerdict: { type: String },
        escalatedAt: { type: Date },
        requestedAt: { type: Date, default: Date.now },
        resolvedAt: { type: Date }
    },

    adminNote: { type: String, default: '' },
    updatedBy: { type: String, default: 'system' },
    processedAt: { type: Date },
    deletedAt: { type: Date, default: null }, // Soft delete
    orderCode: { type: Number },
    paymentTransactionId: { type: String, unique: true, sparse: true }

}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual buyerId (backward-compatible)
orderSchema.virtual('buyerId').get(function (this: any) {
    return this.customerId || this.userId;
});

// ─── INDEXES ────────────────────────────────────────────────────────────────
orderSchema.index({ customerId: 1, createdAt: -1 });           // Lịch sử đơn hàng của Customer
orderSchema.index({ status: 1, createdAt: -1 });               // Admin lọc theo trạng thái
orderSchema.index({ paymentStatus: 1 });                       // Lọc thanh toán
orderSchema.index({ orderCode: 1 });                           // Tra cứu đơn theo mã
orderSchema.index({ createdAt: -1 });                          // Sort mới nhất
orderSchema.index({ 'dispute.isDisputed': 1, 'dispute.status': 1 }); // Quản lý khiếu nại
orderSchema.index({ deletedAt: 1 });                           // Soft delete filter
orderSchema.index({ couponCode: 1 }, { sparse: true });        // Thống kê coupon

const OrderModel: Model<IOrder> = mongoose.model<IOrder>('OrderEntity', orderSchema);

export default OrderModel;
