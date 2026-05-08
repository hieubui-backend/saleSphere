class UserUseCases {
    constructor({ userRepository, hasher, tokenManager }) {
        this.userRepository = userRepository;
        this.hasher = hasher;
        this.tokenManager = tokenManager;
    }

    async register(userData) {
        const { email, password, name, role } = userData;
        
        const userExists = await this.userRepository.findByEmail(email);
        if (userExists) throw new Error('Email đã được sử dụng');

        const hashedPassword = await this.hasher.hash(password);

        const user = await this.userRepository.create({
            name,
            email,
            password: hashedPassword,
            role: role || 'staff'
        });

        return {
            _id: user._id,
            name: user.name,
            email: user.email
        };
    }

    async login(email, password) {
        const user = await this.userRepository.findByEmail(email);
        if (!user) throw new Error('Email hoặc mật khẩu không đúng');

        const isMatch = await this.hasher.compare(password, user.password);
        if (!isMatch) throw new Error('Email hoặc mật khẩu không đúng');

        const token = this.tokenManager.generateToken({
            id: user._id, 
            role: user.role
        });

        return {
            token,
            user: { 
                id: user._id, 
                name: user.name, 
                role: user.role
            }
        };
    }

    async getAllUsers({ page = 1, limit = 10 }) {
        const skip = (page - 1) * limit;
        const limitNum = parseInt(limit, 10);
        
        const users = await this.userRepository.findByRole('staff', skip, limitNum);
        const count = await this.userRepository.countByRole('staff');

        return { users, count };
    }

    async updateUser(id, updateData) {
        return await this.userRepository.updateById(id, {
            name: updateData.name,
            role: updateData.role
        });
    }

    async deleteUser(id) {
        return await this.userRepository.deleteById(id);
    }
}

module.exports = UserUseCases;
