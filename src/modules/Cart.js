const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    items: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        tenantId: { type: mongoose.Schema.Types.ObjectId, required: true },
        quantity: { type: Number, default: 1, min: 1 },
        price: { type: Number, required: true } // Lưu giá tại thời điểm thêm vào giỏ
    }],
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Cart', cartSchema);