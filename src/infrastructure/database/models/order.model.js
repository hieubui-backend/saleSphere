const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
    
    // Hỗ trợ cả dữ liệu cũ (userId) và mới (customerId) để tránh lỗi Validation
    // Cả hai đều để required: false để tránh "gãy" khi lưu đơn hàng cũ/thiếu dữ liệu
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false }, 
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false }, 

    items: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true }, 
        name: String,
        quantity: { type: Number, required: true },
        price: { type: Number, required: true }
    }],
    
    totalAmount: { type: Number, required: true },
    
    status: { 
        type: String, 
        enum: [
            'pending',           // Chờ shop xác nhận
            'waiting_approval',  // Sàn duyệt đơn
            'processing',        // Đang chuẩn bị hàng
            'shipping',          // Đang giao
            'completed',         // Thành công (Tiền về ví Shop)
            'cancelled',         // Hủy đơn
            'failed',            // Giao lỗi
            'returned',          // Đã hoàn trả xong (Tiền về ví Khách)
            'dispute_escalated'  // Sàn đang trọng tài
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
                'pending',          // Shop đang xử lý
                'accepted',         // Shop đồng ý hoàn tiền
                'rejected_by_shop', // Shop từ chối ban đầu
                'rejected',         // ADMIN PHÁN QUYẾT: Bác bỏ khiếu nại (Trả tiền cho Shop)
                'processing',       // Admin đang xem xét
                'resolved'          // ADMIN PHÁN QUYẾT: Đồng ý khiếu nại (Hoàn tiền cho Khách)
            ], 
            default: 'pending' 
        },
        
        shopResponse: { type: String },
        shopImages: [{ type: String }],
        
        returnTrackingNumber: { type: String, default: '' },
        returnShippingPartner: { type: String, default: '' },
        
        // Ghi lại kết quả cuối cùng của Trọng tài (Admin chọn PAY_SHOP hoặc REFUND_CUSTOMER)
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

/**
 * VIRTUALS: Giúp Frontend/Backend gọi .buyerId mà không cần quan tâm 
 * trong DB đang lưu là customerId hay userId.
 */
orderSchema.virtual('buyerId').get(function() {
    return this.customerId || this.userId;
});

/**
 * INDEXES: Tối ưu hiệu năng cho hệ thống
 */
// 1. Tìm nhanh đơn hàng theo trạng thái và thời gian (cho Dashboard Admin)
orderSchema.index({ status: 1, createdAt: -1 });

// 2. Tìm nhanh đơn hàng của từng Shop (cho Dashboard Merchant)
orderSchema.index({ tenantId: 1, createdAt: -1 });

// 3. Lọc danh sách các đơn hàng đang có khiếu nại cần xử lý
orderSchema.index({ "dispute.isDisputed": 1, "dispute.status": 1 });

// 4. Thống kê doanh thu theo thời gian
orderSchema.index({ "createdAt": 1 }); 

module.exports = mongoose.model('Order', orderSchema);