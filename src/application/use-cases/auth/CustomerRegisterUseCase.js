const Customer = require('../../../domain/entities/Customer');
const Email = require('../../../domain/value-objects/Email');

class CustomerRegisterUseCase {
    constructor({ customerRepository, hasher }) {
        this.customerRepository = customerRepository;
        this.hasher = hasher;
    }

    async execute({ name, email, password, phone, address }) {
        const emailVO = new Email(email);
        
        // 1. Kiểm tra email tồn tại
        const existingCustomer = await this.customerRepository.findByEmail(emailVO.getValue());
        if (existingCustomer) {
            throw new Error('Email này đã được sử dụng!');
        }

        // 2. Hash password
        const hashedPassword = await this.hasher.hash(password);

        // 3. Tạo Customer Entity
        const newCustomerEntity = new Customer({
            name,
            email: emailVO.getValue(),
            password: hashedPassword,
            phone,
            address
        });

        // 4. Lưu vào Database
        const savedCustomer = await this.customerRepository.create(newCustomerEntity);

        // Xóa password trước khi trả về (có thể dùng DTO ở mức Presentation, nhưng tạm làm ở đây)
        const response = { ...savedCustomer };
        delete response.password;

        return response;
    }
}

module.exports = CustomerRegisterUseCase;
