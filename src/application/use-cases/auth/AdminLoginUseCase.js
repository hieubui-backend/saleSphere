class AdminLoginUseCase {
    constructor({ userRepository, tenantModel, hasher }) {
        this.userRepository = userRepository;
        this.tenantModel = tenantModel;
        this.hasher = hasher;
    }

    async execute({ email, password }) {
        // 1. Tìm user
        const user = await this.userRepository.findByEmail(email);
        if (!user) {
            throw new Error('Email hoặc mật khẩu không chính xác!');
        }

        // 2. So sánh mật khẩu
        const isMatch = await this.hasher.compare(password, user.password);
        if (!isMatch) {
            throw new Error('Email hoặc mật khẩu không chính xác!');
        }

        // 3. Xử lý Super Admin
        if (user.role === 'super_admin' || user.role === 'super-admin') {
            return {
                id: user._id, 
                name: user.name, 
                tenantId: null, 
                tenantName: 'Hệ thống Quản trị',
                role: 'super_admin' 
            };
        }

        // 4. Xử lý Admin Cửa hàng
        if (!user.tenantId) {
            throw new Error('Tài khoản không thuộc cửa hàng nào!');
        }

        const tenant = await this.tenantModel.findById(user.tenantId).lean();
        
        if (!tenant || tenant.isActive === false) {
            throw new Error('Cửa hàng của bạn đã bị khóa hoặc ngừng hoạt động!');
        }

        return {
            id: user._id, 
            name: user.name, 
            tenantId: user.tenantId, 
            tenantName: tenant.name,
            role: user.role 
        };
    }
}

module.exports = AdminLoginUseCase;
