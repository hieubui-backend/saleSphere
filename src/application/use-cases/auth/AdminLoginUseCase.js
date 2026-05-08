const Email = require('../../../domain/value-objects/Email');

class AdminLoginUseCase {
    constructor({ userRepository, hasher }) {
        this.userRepository = userRepository;
        this.hasher = hasher;
    }

    async execute({ email, password }) {
        const emailVO = new Email(email);

        // 1. Tìm user (trả về Entity)
        const user = await this.userRepository.findByEmail(emailVO.getValue());
        if (!user) {
            throw new Error('Email hoặc mật khẩu không chính xác!');
        }

        // 2. So sánh mật khẩu
        const isMatch = await this.hasher.compare(password, user.password);
        if (!isMatch) {
            throw new Error('Email hoặc mật khẩu không chính xác!');
        }

        // 3. Trả về thông tin session
        return {
            id: user.id, 
            name: user.name, 
            email: user.email,
            role: user.role 
        };
    }
}

module.exports = AdminLoginUseCase;
