const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');

// Import các middleware cần thiết
const { protect, checkRole } = require('../../middlewares/auth.middleware');
const { validateUserRegister } = require('../../middlewares/validation.middleware');

// --- HỆ THỐNG AUTHENTICATION (CÔNG KHAI) ---

/**
 * API Đăng ký (Register)
 */
router.post('/register', validateUserRegister, userController.register);

/**
 * API Đăng nhập (Login)
 */
router.post('/login', userController.login);

// --- QUẢN LÝ NHÂN VIÊN (BẢO MẬT - Cần Token) ---

// Lấy danh sách nhân viên trong cùng công ty (Chỉ Admin)
router.get('/', protect, checkRole(['admin']), userController.getUsers);

// Cập nhật thông tin nhân viên (Chỉ Admin)
router.put('/:id', protect, checkRole(['admin']), userController.updateUser);

// Xóa nhân viên (Chỉ Admin)
router.delete('/:id', protect, checkRole(['admin']), userController.deleteUser);

module.exports = router;
