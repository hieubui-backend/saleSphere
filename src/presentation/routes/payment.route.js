const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');

// Callback từ VNPay sau khi user nhập thẻ thành công
router.get('/vnpay/return', paymentController.vnpayReturn);

// IPN Callback để update DB chắc chắn
router.get('/vnpay/ipn', paymentController.vnpayIpn);

module.exports = router;
