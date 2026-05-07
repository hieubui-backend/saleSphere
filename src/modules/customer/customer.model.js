const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true }, 
    password: { type: String, required: true },
    phone: { type: String },
    address: { type: String },
    // KHÔNG CẦN tenantId ở đây nữa vì khách hàng dùng chung toàn sàn
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Customer', customerSchema);