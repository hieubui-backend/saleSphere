const mongoose = require('mongoose');

const TenantSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
    shopName: { 
        type: String 
    },
    email: { 
        type: String, 
        unique: true 
    },
    password: { 
        type: String 
    },
    slug: { 
        type: String, 
        required: true, 
        unique: true 
    }, 
    
    // MẶC ĐỊNH LÀ FALSE: Chờ Admin phê duyệt mới được hoạt động
    isActive: { 
        type: Boolean, 
        default: false 
    },
    
    // Trạng thái chi tiết: pending (chờ), active (đang chạy), blocked (bị khóa)
    status: {
        type: String,
        enum: ['pending', 'active', 'blocked'],
        default: 'pending'
    },
    
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('Tenant', TenantSchema);