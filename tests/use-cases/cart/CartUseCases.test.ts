import CartUseCases from '../../../src/application/use-cases/cart/CartUseCases';

describe('CartUseCases', () => {
    let cartUseCases: CartUseCases;
    let mockCartRepository: any;
    let mockProductRepository: any;
    let mockOrderUseCases: any;

    beforeEach(() => {
        mockCartRepository = {
            findByCustomerId: jest.fn(),
            save: jest.fn(),
            deleteByCustomerId: jest.fn()
        };
        mockProductRepository = {
            findById: jest.fn()
        };
        mockOrderUseCases = {
            createOrder: jest.fn()
        };
        cartUseCases = new CartUseCases({
            cartRepository: mockCartRepository,
            productRepository: mockProductRepository,
            orderUseCases: mockOrderUseCases
        });
    });

    describe('checkout', () => {
        it('nên tạo đơn hàng và xóa giỏ hàng', async () => {
            const cart = { customerId: 'c1', items: [{ productId: 'p1', quantity: 1 }] };
            mockCartRepository.findByCustomerId.mockResolvedValue(cart);
            mockOrderUseCases.createOrder.mockResolvedValue({ id: 'o1' });

            const result = await cartUseCases.checkout('c1', {});

            expect(mockOrderUseCases.createOrder).toHaveBeenCalled();
            expect(mockCartRepository.deleteByCustomerId).toHaveBeenCalledWith('c1');
            expect(result.id).toBe('o1');
        });

        it('nên ném lỗi nếu giỏ hàng trống', async () => {
            mockCartRepository.findByCustomerId.mockResolvedValue({ items: [] });

            await expect(cartUseCases.checkout('c1', {}))
                .rejects.toThrow('Giỏ hàng trống, không thể thanh toán');
        });
    });
});





