class UserUseCases {
    constructor({ userRepository, hasher, tokenManager }) {
        this.userRepository = userRepository;
        this.hasher = hasher;
        this.tokenManager = tokenManager;
    }

    async register(userData) {
        const { email, password, tenantId, name, role } = userData;
        
        const userExists = await this.userRepository.findByEmail(email);
        if (userExists) throw new Error('Email đã được sử dụng');

        const hashedPassword = await this.hasher.hash(password);

        const user = await this.userRepository.create({
            tenantId,
            name,
            email,
            password: hashedPassword,
            role: role || 'staff'
        });

        return {
            _id: user._id,
            name: user.name,
            email: user.email,
            tenantId: user.tenantId
        };
    }

    async login(email, password) {
        const user = await this.userRepository.findByEmail(email);
        if (!user) throw new Error('Email hoặc mật khẩu không đúng');

        const isMatch = await this.hasher.compare(password, user.password);
        if (!isMatch) throw new Error('Email hoặc mật khẩu không đúng');

        const token = this.tokenManager.generateToken({
            id: user._id, 
            tenantId: user.tenantId, 
            role: user.role
        });

        return {
            token,
            user: { 
                id: user._id, 
                name: user.name, 
                role: user.role, 
                tenantId: user.tenantId 
            }
        };
    }

    async getAllUsers(tenantId, { page = 1, limit = 10 }) {
        const skip = (page - 1) * limit;
        const limitNum = parseInt(limit, 10);
        
        // Dùng repository
        const users = await this.userRepository.findByTenantAndRole(tenantId, 'staff', skip, limitNum);
        const count = await this.userRepository.countByTenantAndRole(tenantId, 'staff');

        return { users, count };
    }

    async updateUser(id, tenantId, updateData) {
        return await this.userRepository.updateByIdAndTenant(id, tenantId, {
            name: updateData.name,
            role: updateData.role
        });
    }

    async deleteUser(id, tenantId) {
        return await this.userRepository.deleteByIdAndTenant(id, tenantId);
    }
}

module.exports = UserUseCases;
