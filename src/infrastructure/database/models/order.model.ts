import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IOrder extends Document {
    customerId?: mongoose.Types.ObjectId;
    userId?: mongoose.Types.ObjectId;
    items: {
        product: mongoose.Types.ObjectId;
        name: string;
        quantity: number;
        price: number;
    }[];
    subtotal: number;
    shippingFee: number;
    totalAmount: number;
    paymentMethod: 'vnpay' | 'momo' | 'cod' | 'bank_transfer';
    paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
    shippingAddress?: string;
    region: string;
    status: string;
    shippingPartner: string;
    trackingNumber: string;
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
    createdAt: Date;
    updatedAt: Date;
    buyerId: mongoose.Types.ObjectId;
    orderCode?: number;
    paymentTransactionId?: string;
}

const orderSchema: Schema = new Schema({
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserEntity', required: false }, 
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserEntity', required: false }, 

    items: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductEntity', required: true }, 
        name: String,
        quantity: { type: Number, required: true },
        price: { type: Number, required: true }
    }],
    subtotal: { type: Number, required: true, default: 0 },
    shippingFee: { type: Number, required: true, default: 0 },
    totalAmount: { type: Number, required: true },
    
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
    shippingAddress: { type: String },
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

    dispute: {
        isDisputed: { type: Boolean, default: false },
        type: { 
            type: String, 
            enum: ['return_refund', 'refund_only'], 
            default: 'return_refund' 
        }, 
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
    orderCode: { type: Number },
    paymentTransactionId: { type: String, unique: true, sparse: true }

}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

orderSchema.virtual('buyerId').get(function(this: any) {
    return this.customerId || this.userId;
});

const OrderModel: Model<IOrder> = mongoose.model<IOrder>('OrderEntity', orderSchema);

export default OrderModel;





