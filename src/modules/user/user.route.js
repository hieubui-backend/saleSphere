const express = require('express');
const router = express.Router();
const User = require('./user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userController = require('../../controllers/user.controller');

// Import các middleware cần thiết
const { protect, checkRole } = require('../../middlewares/auth.middleware');
const { validateUserRegister } = require('../../middlewares/validation.middleware');

// --- HỆ THỐNG AUTHENTICATION (CÔNG KHAI) ---

/**
 * API Đăng ký (Register)
 * Ghi chú: Đã loại bỏ 'protect' để bạn có thể tạo tài khoản Admin đầu tiên trên Postman.
 */
router.post('/register', validateUserRegister, async (req, res) => {
    try {
        const { tenantId, name, email, password, role } = req.body;

        // 1. Kiểm tra email đã tồn tại chưa
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, message: "Email đã được sử dụng" });
        }

        // 2. Mã hóa mật khẩu
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Tạo User mới
        const newUser = new User({ 
            tenantId, // Truyền trực tiếp từ body cho tài khoản đầu tiên
            name, 
            email, 
            password: hashedPassword, 
            role: role || 'admin' // Mặc định là admin nếu không truyền
        });

        await newUser.save();

        // 4. Trả về kết quả (ẩn password)
        const userResponse = newUser.toObject();
        delete userResponse.password;

        res.status(201).json({ success: true, data: userResponse });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

/**
 * API Đăng nhập (Login)
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ success: false, message: "Email hoặc mật khẩu không đúng" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ success: false, message: "Email hoặc mật khẩu không đúng" });

        // Tạo JWT Token chứa thông tin quan trọng
        const token = jwt.sign(
            { userId: user._id, tenantId: user.tenantId, role: user.role },
            process.env.JWT_SECRET || 'secret_key_cua_ban',
            { expiresIn: '1d' }
        );

        res.json({
            success: true,
            token,
            user: { 
                id: user._id,
                name: user.name, 
                role: user.role, 
                tenantId: user.tenantId 
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- QUẢN LÝ NHÂN VIÊN (BẢO MẬT - Cần Token) ---

// Lấy danh sách nhân viên trong cùng công ty (Chỉ Admin)
router.get('/', protect, checkRole(['admin']), userController.getUsers);

// Cập nhật thông tin nhân viên (Chỉ Admin)
router.put('/:id', protect, checkRole(['admin']), userController.updateUser);

// Xóa nhân viên (Chỉ Admin)
router.delete('/:id', protect, checkRole(['admin']), userController.deleteUser);

module.exports = router;