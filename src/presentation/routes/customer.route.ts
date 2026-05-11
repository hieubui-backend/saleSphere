import express from 'express';
import * as customerController from '../controllers/customer.controller';
import * as cartController from '../controllers/cart.controller';
import * as orderController from '../controllers/order.controller';
import { protect, optionalAuth } from '../../middlewares/auth.middleware';
import { validateCustomerRegister } from '../../middlewares/validation.middleware';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Customer
 *     description: APIs dành cho khách hàng
 *   - name: Cart
 *     description: Quản lý giỏ hàng
 */

// ==========================================
// 1. XÁC THỰC (AUTH API)
// ==========================================

/**
 * @swagger
 * /api/customer/register:
 *   post:
 *     summary: Đăng ký tài khoản khách hàng
 *     tags: [Customer]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       201:
 *         description: Đăng ký thành công
 */
router.post('/register', validateCustomerRegister, customerController.register);

/**
 * @swagger
 * /api/customer/login:
 *   post:
 *     summary: Đăng nhập khách hàng
 *     tags: [Customer]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 */
router.post('/login', customerController.login);

// ==========================================
// 2. TÀI KHOẢN (PROFILE)
// ==========================================

/**
 * @swagger
 * /api/customer/profile:
 *   get:
 *     summary: Lấy thông tin cá nhân
 *     tags: [Customer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Customer'
 */
router.get('/profile', protect, customerController.getProfile);

/**
 * @swagger
 * /api/customer/profile:
 *   put:
 *     summary: Cập nhật thông tin cá nhân
 *     tags: [Customer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/profile', protect, customerController.updateProfile);

// ==========================================
// 3. GIỎ HÀNG (CART)
// ==========================================

/**
 * @swagger
 * /api/customer/cart:
 *   get:
 *     summary: Lấy giỏ hàng hiện tại
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/cart', optionalAuth, cartController.getCart);

/**
 * @swagger
 * /api/customer/cart/add:
 *   post:
 *     summary: Thêm sản phẩm vào giỏ hàng
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId, quantity]
 *             properties:
 *               productId:
 *                 type: string
 *               quantity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Đã thêm vào giỏ
 */
router.post('/cart/add', optionalAuth, cartController.addToCart);

/**
 * @swagger
 * /api/customer/cart/update:
 *   put:
 *     summary: Cập nhật số lượng trong giỏ hàng
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId, quantity]
 *             properties:
 *               productId:
 *                 type: string
 *               quantity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/cart/update', optionalAuth, cartController.updateCartQuantity);

/**
 * @swagger
 * /api/customer/cart/items/{productId}:
 *   delete:
 *     summary: Xóa sản phẩm khỏi giỏ hàng
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.delete('/cart/items/:productId', optionalAuth, cartController.removeFromCart);

/**
 * @swagger
 * /api/customer/cart/checkout:
 *   post:
 *     summary: Thanh toán giỏ hàng
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [shippingAddress]
 *             properties:
 *               shippingAddress:
 *                 type: string
 *               paymentMethod:
 *                 type: string
 *                 enum: [cod, vnpay, momo, bank_transfer]
 *               region:
 *                 type: string
 *     responses:
 *       201:
 *         description: Đặt hàng thành công
 */
router.post('/cart/checkout', optionalAuth, cartController.checkout);

// ==========================================
// 4. ĐƠN HÀNG CỦA KHÁCH
// ==========================================

/**
 * @swagger
 * /api/customer/orders:
 *   get:
 *     summary: Lấy danh sách đơn hàng của khách
 *     tags: [Customer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/orders', protect, orderController.getCustomerOrders);
router.get('/orders/:id/payment-link', protect, orderController.getPaymentLink);

// ==========================================
// 5. KHIẾU NẠI (DISPUTES)
// ==========================================

/**
 * @swagger
 * /api/customer/orders/{id}/dispute:
 *   post:
 *     summary: Khiếu nại đơn hàng
 *     tags: [Customer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reason]
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Gửi khiếu nại thành công
 */
router.post('/orders/:id/dispute', protect, orderController.createDispute);

export default router;
