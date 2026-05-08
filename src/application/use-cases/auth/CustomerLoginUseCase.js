class CustomerLoginUseCase {
    constructor({ customerRepository, hasher, tokenManager }) {
        this.customerRepository = customerRepository;
        this.hasher = hasher;
        this.tokenManager = tokenManager;
    }

    async execute({ email, password }) {
        // 1. Tìm user
        const customer = await this.customerRepository.findByEmail(email);
        if (!customer) {
            throw new Error('Email hoặc mật khẩu không chính xác!');
        }

        // 2. So sánh mật khẩu
        const isMatch = await this.hasher.compare(password, customer.password);
        if (!isMatch) {
            throw new Error('Email hoặc mật khẩu không chính xác!');
        }

        // 3. Tạo JWT token cho client (React)
        const tokenPayload = {
            id: customer._id,
            role: 'customer'
        };
        const token = this.tokenManager.generateToken(tokenPayload);

        return {
            token,
            customer: {
                id: customer._id,
                name: customer.name,
                email: customer.email,
                phone: customer.phone,
                address: customer.address
            }
        };
    }
}

module.exports = CustomerLoginUseCase;
