import express from 'express';
import * as paymentController from '../controllers/payment.controller';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Payment
 *   description: Xử lý thanh toán
 */

/**
 * @swagger
 * /api/payment/vnpay/return:
 *   get:
 *     summary: VNPay Return URL (Callback)
 *     tags: [Payment]
 *     responses:
 *       200:
 *         description: Trả về trang kết quả thanh toán
 */
router.get('/vnpay/return', paymentController.vnpayReturn);

/**
 * @swagger
 * /api/payment/vnpay/ipn:
 *   get:
 *     summary: VNPay IPN (Instant Payment Notification)
 *     tags: [Payment]
 *     responses:
 *       200:
 *         description: Xác nhận trạng thái giao dịch
 */
router.get('/vnpay/ipn', paymentController.vnpayIpn);

export default router;





