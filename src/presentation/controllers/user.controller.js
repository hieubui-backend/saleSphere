const asyncHandler = require('express-async-handler');

exports.register = asyncHandler(async (req, res) => {
    const { userUseCases } = req.container.cradle;
    const user = await userUseCases.register(req.body);
    res.status(201).json(user);
});

exports.login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const { userUseCases } = req.container.cradle;
    const result = await userUseCases.login(email, password);
    res.status(200).json(result);
});

exports.getUsers = asyncHandler(async (req, res) => {
    const { page, limit } = req.query;
    const { userUseCases } = req.container.cradle;
    const result = await userUseCases.getAllUsers(req.user.tenantId, { page, limit });
    res.status(200).json({
        success: true,
        total: result.count,
        data: result.users
    });
});

exports.updateUser = asyncHandler(async (req, res) => {
    const { userUseCases } = req.container.cradle;
    const updated = await userUseCases.updateUser(req.params.id, req.user.tenantId, req.body);
    if (!updated) {
        res.status(404);
        throw new Error('Không tìm thấy người dùng');
    }
    res.json(updated);
});

exports.deleteUser = asyncHandler(async (req, res) => {
    const { userUseCases } = req.container.cradle;
    const deleted = await userUseCases.deleteUser(req.params.id, req.user.tenantId);
    if (!deleted) {
        res.status(404);
        throw new Error('Xóa thất bại: Người dùng không tồn tại');
    }
    res.json({ message: 'Đã xóa nhân viên thành công' });
});
