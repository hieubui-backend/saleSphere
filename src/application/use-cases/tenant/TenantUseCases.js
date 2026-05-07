class TenantUseCases {
    constructor({ tenantRepository, productRepository }) {
        this.tenantRepository = tenantRepository;
        this.productRepository = productRepository;
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

    async toggleTenantStatus(id, isActiveForce = null) {
        const tenant = await this.tenantRepository.findById(id);
        if (!tenant) throw new Error('Không tìm thấy cửa hàng!');

        const newStatus = isActiveForce !== null ? !!isActiveForce : !tenant.isActive;
        
        tenant.isActive = newStatus;
        tenant.status = newStatus ? 'active' : 'blocked';
        await tenant.save();

        // Ẩn hoặc hiện tất cả sản phẩm của shop này
        if (this.productRepository && this.productRepository.updateOne) {
            await this.productRepository.productModel.updateMany(
                { tenantId: tenant._id },
                { $set: { isActive: newStatus } }
            );
        }

        return tenant;
    }
}

module.exports = TenantUseCases;
