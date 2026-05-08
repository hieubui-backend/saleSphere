const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    // Hỗ trợ cả dữ liệu cũ (userId) và mới (customerId) để tránh lỗi Validation
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false }, 
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false }, 

    items: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true }, 
        name: String,
        quantity: { type: Number, required: true },
        price: { type: Number, required: true }
    }],
    subtotal: { type: Number, required: true, default: 0 },
    shippingFee: { type: Number, required: true, default: 0 },
    totalAmount: { type: Number, required: true },
    
    paymentMethod: { 
        type: String, 
        enum: ['vnpay', 'momo', 'cod'], 
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
            'pending',           // Chờ xác nhận
            'processing',        // Đang chuẩn bị hàng
            'shipping',          // Đang giao
            'completed',         // Thành công
            'cancelled',         // Hủy đơn
            'failed',            // Giao lỗi
            'returned',          // Đã hoàn trả xong
            'dispute_escalated'  // Đang xử lý tranh chấp
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
            enum: [
                'pending',          // Đang xử lý
                'accepted',         // Đồng ý hoàn tiền
                'rejected',         // Bác bỏ khiếu nại
                'processing',       // Đang xem xét
                'resolved'          // Đã giải quyết
            ], 
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
    processedAt: { type: Date }

}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

orderSchema.virtual('buyerId').get(function() {
    return this.customerId || this.userId;
});

orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ "dispute.isDisputed": 1, "dispute.status": 1 });
orderSchema.index({ "createdAt": 1 }); 

module.exports = mongoose.model('Order', orderSchema);