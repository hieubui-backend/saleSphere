import express from 'express';
import * as authController from '../controllers/auth.controller';
import { validateUserLogin, validateUserRegister } from '../../middlewares/validation.middleware';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Quản lý xác thực người dùng (Admin/Staff)
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Đăng nhập Admin/Staff
 *     tags: [Auth]
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
 *       401:
 *         description: Sai thông tin đăng nhập
 */
router.post('/login', validateUserLogin, authController.handleLogin);

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Đăng ký tài khoản Admin/Staff
 *     tags: [Auth]
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
 *               role:
 *                 type: string
 *                 enum: [admin, staff]
 *     responses:
 *       201:
 *         description: Đăng ký thành công
 *       400:
 *         description: Email đã tồn tại hoặc dữ liệu không hợp lệ
 */
router.post('/register', validateUserRegister, authController.handleRegister);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Đăng xuất
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Đăng xuất thành công
 */
router.post('/logout', authController.handleLogout);

export default router;
