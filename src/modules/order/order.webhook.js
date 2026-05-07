const express = require('express');
const router = express.Router();
const orderController = require('../../presentation/controllers/order.controller');

/**
 * POST /api/webhook/logistics
 * Endpoint giả lập nhận dữ liệu từ đơn vị vận chuyển
 */
router.post('/logistics', orderController.handleLogisticsWebhook);

module.exports = router;