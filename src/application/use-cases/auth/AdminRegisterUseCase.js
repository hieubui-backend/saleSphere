const User = require('../../../domain/entities/User');
const Email = require('../../../domain/value-objects/Email');

class AdminRegisterUseCase {
    constructor({ userRepository, hasher }) {
        this.userRepository = userRepository;
        this.hasher = hasher;
    }

    async execute({ name, email, password }) {
        const emailVO = new Email(email);

        // 1. Kiểm tra email tồn tại
        const userExists = await this.userRepository.findByEmail(emailVO.getValue());
        if (userExists) {
            throw new Error('Email này đã được sử dụng!');
        }

        // 2. Hash password
        const hashedPassword = await this.hasher.hash(password);

        // 3. Tạo User Entity
        const userEntity = new User({
            name,
            email: emailVO.getValue(),
            password: hashedPassword,
            role: 'admin'
        });

        const newUser = await this.userRepository.create(userEntity);

        const response = { ...newUser };
        delete response.password;
        
        return response;
    }
}

module.exports = AdminRegisterUseCase;

module.exports = AdminRegisterUseCase;
