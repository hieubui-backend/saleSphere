const User = require('../modules/user/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 1. Đăng ký tài khoản mới
const register = async (userData) => {
    const { email, password, tenantId, name, role } = userData;
    
    // Kiểm tra email tồn tại
    const userExists = await User.findOne({ email });
    if (userExists) throw new Error('Email đã được sử dụng');

    // Mã hóa mật khẩu
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
        tenantId,
        name,
        email,
        password: hashedPassword,
        role
    });

    return {
        _id: user._id,
        name: user.name,
        email: user.email,
        tenantId: user.tenantId
    };
};

// 2. Đăng nhập
const login = async (email, password) => {
    const user = await User.findOne({ email });
    if (!user) throw new Error('Email hoặc mật khẩu không đúng');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error('Email hoặc mật khẩu không đúng');

    // Tạo JWT Token
    const token = jwt.sign(
        { id: user._id, tenantId: user.tenantId, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
    );

    return {
        token,
        user: { id: user._id, name: user.name, role: user.role, tenantId: user.tenantId }
    };
};

// 3. Lấy danh sách nhân viên
const getAllUsers = async (tenantId, { page = 1, limit = 10 }) => {
    const query = { tenantId };
    const users = await User.find(query)
        .select('-password')
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 });

    const count = await User.countDocuments(query);
    return { users, count };
};

// 4. Cập nhật nhân viên
const updateUser = async (id, tenantId, updateData) => {
    return await User.findOneAndUpdate(
        { _id: id, tenantId },
        { name: updateData.name, role: updateData.role },
        { new: true }
    ).select('-password');
};

// 5. Xóa nhân viên
const deleteUser = async (id, tenantId) => {
    return await User.findOneAndDelete({ _id: id, tenantId });
};

module.exports = {
    register,
    login,
    getAllUsers,
    updateUser,
    deleteUser
};