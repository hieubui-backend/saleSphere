import ProductUseCases from '../../../src/application/use-cases/product/ProductUseCases';

describe('ProductUseCases', () => {
    let productUseCases: ProductUseCases;
    let mockProductRepository: any;

    beforeEach(() => {
        mockProductRepository = {
            findAll: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            updateById: jest.fn(),
            deleteById: jest.fn()
        };
        productUseCases = new ProductUseCases({ productRepository: mockProductRepository });
    });

    describe('getAllProducts', () => {
        it('nên gọi repository.findAll với đúng tham số', async () => {
            const query = { page: 1, limit: 10 };
            mockProductRepository.findAll.mockResolvedValue([]);

            await productUseCases.getAllProducts(query);

            expect(mockProductRepository.findAll).toHaveBeenCalledWith(query);
        });
    });

    describe('createProduct', () => {
        it('nên tạo sản phẩm với ảnh mặc định nếu không cung cấp ảnh', async () => {
            const productData = { name: 'Test ProductEntity', price: 100, stock: 10 };
            mockProductRepository.create.mockImplementation((data: any) => Promise.resolve({ id: '1', ...data }));

            const result: any = await productUseCases.createProduct(productData);

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
            mockProductRepository.create.mockImplementation((data: any) => Promise.resolve(data));

            const result: any = await productUseCases.createProduct(productData);

            expect(result.price).toBe(150);
            expect(result.stock).toBe(5);
        });
    });

    describe('updateProduct', () => {
        it('nên gọi repository.updateById với dữ liệu đã chuẩn hóa', async () => {
            const id = 'prod1';
            const updateData = { name: ' Updated ', price: '200' };
            const existingProduct = { id, name: 'Old', price: 100, stock: 10 };
            
            mockProductRepository.findById.mockResolvedValue(existingProduct);
            mockProductRepository.updateById.mockResolvedValue({ ...existingProduct, name: 'Updated', price: 200 });

            const result: any = await productUseCases.updateProduct(id, updateData);

            expect(mockProductRepository.updateById).toHaveBeenCalledWith(id, expect.objectContaining({
                name: 'Updated',
                price: 200
            }));
            expect(result.name).toBe('Updated');
        });
    });

    describe('deleteProduct', () => {
        it('nên gọi repository.deleteById', async () => {
            const id = 'prod1';
            mockProductRepository.deleteById.mockResolvedValue(undefined);

            await productUseCases.deleteProduct(id);

            expect(mockProductRepository.deleteById).toHaveBeenCalledWith(id);
        });
    });
});





