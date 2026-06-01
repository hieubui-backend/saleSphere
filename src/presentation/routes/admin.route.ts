import express from 'express';
import * as productController from '../controllers/product.controller';
import * as orderController from '../controllers/order.controller';
import * as customerController from '../controllers/customer.controller';
import { protect, checkRole } from '../../middlewares/auth.middleware';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: API quản trị dành cho Admin/Staff
 */

// ==========================================
// DASHBOARD
// ==========================================

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Lấy thống kê dashboard
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/dashboard', protect, checkRole('admin', 'staff'), orderController.getDashboard);

// ==========================================
// QUẢN LÝ SẢN PHẨM (Admin view)
// ==========================================

/**
 * @swagger
 * /api/admin/products:
 *   get:
 *     summary: Lấy danh sách sản phẩm (Admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/products', protect, checkRole('admin', 'staff'), productController.getProducts);

/**
 * @swagger
 * /api/admin/products/{id}:
 *   get:
 *     summary: Lấy chi tiết sản phẩm (Admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/products/:id', protect, checkRole('admin', 'staff'), productController.getProductById);

// ==========================================
// QUẢN LÝ ĐƠN HÀNG (Admin view)
// ==========================================

/**
 * @swagger
 * /api/admin/orders:
 *   get:
 *     summary: Lấy danh sách đơn hàng (Admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/orders', protect, checkRole('admin', 'staff'), orderController.getOrders);

/**
 * @swagger
 * /api/admin/orders/{id}:
 *   get:
 *     summary: Lấy chi tiết đơn hàng (Admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/orders/:id', protect, checkRole('admin', 'staff'), orderController.getOrderById);

// ==========================================
// QUẢN LÝ KHÁCH HÀNG (Admin CRUD)
// ==========================================

/**
 * @swagger
 * /api/admin/customers:
 *   get:
 *     summary: Lấy danh sách khách hàng
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/customers', protect, checkRole('admin', 'staff'), customerController.getAllCustomers);

/**
 * @swagger
 * /api/admin/customers:
 *   post:
 *     summary: Tạo khách hàng mới
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
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
 *         description: Tạo thành công
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/customers', protect, checkRole('admin', 'staff'), customerController.createCustomer);

/**
 * @swagger
 * /api/admin/customers/{id}:
 *   put:
 *     summary: Cập nhật khách hàng
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
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
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put('/customers/:id', protect, checkRole('admin', 'staff'), customerController.updateCustomer);

/**
 * @swagger
 * /api/admin/customers/{id}:
 *   delete:
 *     summary: Xóa khách hàng
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.delete('/customers/:id', protect, checkRole('admin'), customerController.deleteCustomer);

export default router;
