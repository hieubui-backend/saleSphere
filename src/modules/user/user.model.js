const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    // CHỈNH SỬA: tenantId không còn là bắt buộc (required: false) 
    // vì Super Admin sẽ không có ID này.
    tenantId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Tenant', 
        required: false, 
        default: null 
    },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    // CHỈNH SỬA: Thêm 'super_admin' vào danh sách enum để được phép lưu
    role: { 
        type: String, 
        enum: ['admin', 'staff', 'super_admin'], 
        default: 'staff' 
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);