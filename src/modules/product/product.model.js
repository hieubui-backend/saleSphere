const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    tenantId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Tenant', 
        required: [true, 'Sản phẩm phải thuộc về một Tenant cụ thể'],
        index: true 
    }, 
    name: { 
        type: String, 
        required: [true, 'Tên sản phẩm không được để trống'],
        trim: true 
    },
    price: { 
        type: Number, 
        required: [true, 'Giá sản phẩm là bắt buộc'],
        min: [0, 'Giá sản phẩm không được nhỏ hơn 0']
    },
    stock: { 
        type: Number, 
        default: 0, 
        min: [0, 'Số lượng tồn kho không được nhỏ hơn 0'] 
    },
    description: { 
        type: String,
        trim: true
    },
    // Đổi từ String sang Array để chứa nhiều hình ảnh
    images: [{ 
        type: String,
        default: ['/images/default-product.png'] 
    }],
    category: { 
        type: String,
        index: true 
    },
    isActive: {
        type: Boolean,
        default: true 
    }
}, { 
    timestamps: true 
});

productSchema.index({ tenantId: 1, name: 'text' }); 

module.exports = mongoose.model('Product', productSchema);