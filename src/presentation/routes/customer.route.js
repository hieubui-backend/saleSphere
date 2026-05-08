const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customer.controller');
const cartController = require('../controllers/cart.controller');
const orderController = require('../controllers/order.controller');
const { protect } = require('../../middlewares/auth.middleware');

// ==========================================
// 1. XÁC THỰC (AUTH)
// ==========================================
router.post('/register', customerController.register);
router.post('/login', customerController.login);

// ==========================================
// 2. TÀI KHOẢN (PROFILE)
// ==========================================
router.get('/profile', protect, customerController.getProfile);
router.put('/profile', protect, customerController.updateProfile);

// ==========================================
// 3. GIỎ HÀNG (CART) - Được gọi từ Client React
// ==========================================
// Lấy giỏ hàng sẽ được chuyển vào một route riêng hoặc dùng GET /customer/cart
// Tuy nhiên hiện tại cartController mới có update và checkout. Thêm route cart update:
router.post('/cart/update', protect, cartController.updateCartQuantity);
router.post('/cart/checkout', protect, cartController.checkout);

// ==========================================
// 4. KHIẾU NẠI (DISPUTES)
// ==========================================
// Tạm thời gắn route khiếu nại của customer tại đây
router.post('/orders/:id/dispute', protect, orderController.resolveDispute);

module.exports = router;