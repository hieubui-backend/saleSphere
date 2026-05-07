class TenantUseCases {
    constructor({ tenantRepository }) {
        this.tenantRepository = tenantRepository;
    }

    async createTenant({ name, shopName, email, password, slug }) {
        const existing = await this.tenantRepository.findByEmailOrSlug(email, slug);
        if (existing) {
            throw new Error('Email hoặc slug đã tồn tại!');
        }

        return await this.tenantRepository.create({ 
            name, shopName, email, password, slug, 
            isActive: true, status: 'active' 
        });
    }

    async updateTenant(id, { name, shopName, email, slug }) {
        const tenant = await this.tenantRepository.updateById(id, { name, shopName, email, slug });
        if (!tenant) throw new Error('Không tìm thấy cửa hàng!');
        return tenant;
    }

    async deleteTenant(id) {
        const tenant = await this.tenantRepository.deleteById(id);
        if (!tenant) throw new Error('Không tìm thấy cửa hàng!');
        return tenant;
    }

    async getAllTenants(filter = {}) {
        return await this.tenantRepository.findAll(filter);
    }

    async toggleTenantStatus(id) {
        const tenant = await this.tenantRepository.findById(id);
        if (!tenant) throw new Error('Không tìm thấy cửa hàng!');

        tenant.isActive = !tenant.isActive;
        tenant.status = tenant.isActive ? 'active' : 'blocked';
        await tenant.save();
        return tenant;
    }
}

module.exports = TenantUseCases;
