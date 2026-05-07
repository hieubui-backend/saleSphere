const TenantUseCases = require('../../../src/application/use-cases/tenant/TenantUseCases');

describe('TenantUseCases', () => {
    let tenantUseCases;
    let mockTenantRepository;

    beforeEach(() => {
        mockTenantRepository = {
            findByEmailOrSlug: jest.fn(),
            create: jest.fn(),
            updateById: jest.fn(),
            deleteById: jest.fn(),
            findAll: jest.fn(),
            findById: jest.fn()
        };
        tenantUseCases = new TenantUseCases({ tenantRepository: mockTenantRepository });
    });

    describe('createTenant', () => {
        it('nên tạo tenant thành công nếu email/slug chưa tồn tại', async () => {
            const tenantData = { name: 'Shop 1', shopName: 'Shop One', email: 'shop1@test.com', slug: 'shop-1' };
            mockTenantRepository.findByEmailOrSlug.mockResolvedValue(null);
            mockTenantRepository.create.mockResolvedValue({ _id: '123', ...tenantData });

            const result = await tenantUseCases.createTenant(tenantData);

            expect(result.email).toBe('shop1@test.com');
            expect(mockTenantRepository.create).toHaveBeenCalledWith({
                ...tenantData,
                isActive: true,
                status: 'active'
            });
        });

        it('nên ném lỗi nếu email/slug đã tồn tại', async () => {
            mockTenantRepository.findByEmailOrSlug.mockResolvedValue({ _id: 'old' });

            await expect(tenantUseCases.createTenant({ email: 'exists@test.com' }))
                .rejects.toThrow('Email hoặc slug đã tồn tại!');
        });
    });

    describe('toggleTenantStatus', () => {
        it('nên đảo ngược trạng thái isActive và cập nhật status', async () => {
            const tenant = { _id: '1', isActive: true, save: jest.fn() };
            mockTenantRepository.findById.mockResolvedValue(tenant);

            const result = await tenantUseCases.toggleTenantStatus('1');

            expect(result.isActive).toBe(false);
            expect(result.status).toBe('blocked');
            expect(tenant.save).toHaveBeenCalled();
        });
    });
});
