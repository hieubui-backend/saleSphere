const ProductUseCases = require('../../../src/application/use-cases/product/ProductUseCases');

describe('ProductUseCases', () => {
    let productUseCases;
    let mockProductRepository;

    beforeEach(() => {
        mockProductRepository = {
            findByTenant: jest.fn(),
            findByIdAndTenant: jest.fn(),
            create: jest.fn(),
            updateByIdAndTenant: jest.fn(),
            deleteByIdAndTenant: jest.fn()
        };
        productUseCases = new ProductUseCases({ productRepository: mockProductRepository });
    });

    describe('getAllProducts', () => {
        it('nên gọi repository.findByTenant với đúng tham số', async () => {
            const tenantId = 'tenant123';
            const query = { page: 1, limit: 10 };
            mockProductRepository.findByTenant.mockResolvedValue({ products: [], count: 0 });

            await productUseCases.getAllProducts(tenantId, query);

            expect(mockProductRepository.findByTenant).toHaveBeenCalledWith(tenantId, query);
        });
    });

    describe('createProduct', () => {
        it('nên tạo sản phẩm với ảnh mặc định nếu không cung cấp ảnh', async () => {
            const productData = { name: 'Test Product', price: 100, stock: 10 };
            mockProductRepository.create.mockImplementation(data => Promise.resolve({ _id: '1', ...data }));

            const result = await productUseCases.createProduct(productData);

            expect(result.images).toEqual(['/images/default-product.png']);
            expect(mockProductRepository.create).toHaveBeenCalled();
        });

        it('nên ném lỗi nếu tên sản phẩm trống', async () => {
            const productData = { name: '', price: 100 };

            await expect(productUseCases.createProduct(productData))
                .rejects.toThrow('Tên sản phẩm không được để trống');
        });

        it('nên chuẩn hóa giá và tồn kho về số', async () => {
            const productData = { name: 'Test', price: '150', stock: '5' };
            mockProductRepository.create.mockImplementation(data => Promise.resolve(data));

            const result = await productUseCases.createProduct(productData);

            expect(result.price).toBe(150);
            expect(result.stock).toBe(5);
        });
    });

    describe('updateProduct', () => {
        it('nên gọi repository.updateByIdAndTenant với dữ liệu đã chuẩn hóa', async () => {
            const id = 'prod1';
            const tenantId = 'tenant1';
            const updateData = { name: ' Updated ', price: '200' };
            mockProductRepository.updateByIdAndTenant.mockResolvedValue({ _id: id, name: 'Updated', price: 200 });

            const result = await productUseCases.updateProduct(id, tenantId, updateData);

            expect(mockProductRepository.updateByIdAndTenant).toHaveBeenCalledWith(id, tenantId, {
                name: 'Updated',
                price: 200
            });
            expect(result.name).toBe('Updated');
        });
    });

    describe('deleteProduct', () => {
        it('nên gọi repository.deleteByIdAndTenant', async () => {
            const id = 'prod1';
            const tenantId = 'tenant1';
            mockProductRepository.deleteByIdAndTenant.mockResolvedValue({ _id: id });

            await productUseCases.deleteProduct(id, tenantId);

            expect(mockProductRepository.deleteByIdAndTenant).toHaveBeenCalledWith(id, tenantId);
        });
    });
});
