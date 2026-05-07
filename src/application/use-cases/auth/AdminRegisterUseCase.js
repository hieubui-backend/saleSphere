class AdminRegisterUseCase {
    constructor({ userRepository, tenantModel, hasher }) {
        this.userRepository = userRepository;
        this.tenantModel = tenantModel;
        this.hasher = hasher;
    }

    async execute({ shopName, name, email, password }) {
        // 1. Kiểm tra email tồn tại
        const userExists = await this.userRepository.findByEmail(email);
        if (userExists) {
            throw new Error('Email này đã được sử dụng!');
        }

        // 2. Tạo slug
        const slug = shopName
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/đ/g, "d")
            .replace(/Đ/g, "D")
            .replace(/[^\w\s-]/g, "")
            .trim()
            .replace(/\s+/g, "-");

        // 3. Tạo Tenant
        const newTenant = await this.tenantModel.create({ 
            name: shopName, 
            slug: slug, 
            isActive: false, 
            status: 'pending' 
        });

        // 4. Hash password
        const hashedPassword = await this.hasher.hash(password);

        // 5. Tạo User
        const newUser = await this.userRepository.create({
            name,
            email,
            password: hashedPassword,
            tenantId: newTenant._id,
            role: 'admin'
        });

        return newUser;
    }
}

module.exports = AdminRegisterUseCase;
