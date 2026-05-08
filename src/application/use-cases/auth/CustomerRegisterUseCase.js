class CustomerRegisterUseCase {
    constructor({ customerRepository, hasher }) {
        this.customerRepository = customerRepository;
        this.hasher = hasher;
    }

    async execute({ name, email, password, phone, address }) {
        // 1. Kiểm tra email tồn tại
        const existingCustomer = await this.customerRepository.findByEmail(email);
        if (existingCustomer) {
            throw new Error('Email này đã được sử dụng!');
        }

        // 2. Hash password
        const hashedPassword = await this.hasher.hash(password);

        // 3. Tạo Customer
        const newCustomer = await this.customerRepository.create({
            name,
            email,
            password: hashedPassword,
            phone,
            address
        });

        // Xóa password trước khi trả về
        const customerResponse = newCustomer.toObject();
        delete customerResponse.password;

        return customerResponse;
    }
}

module.exports = CustomerRegisterUseCase;
