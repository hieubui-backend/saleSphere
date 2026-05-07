const CartUseCases = require('../../../src/application/use-cases/cart/CartUseCases');

describe('CartUseCases', () => {
    let cartUseCases;
    let mockCartRepository;
    let mockProductModel;
    let mockOrderUseCases;

    beforeEach(() => {
        mockCartRepository = {
            findByCustomerIdWithProduct: jest.fn(),
            findByCustomerId: jest.fn(),
            deleteByCustomerId: jest.fn()
        };
        mockOrderUseCases = {
            createOrder: jest.fn()
        };
        cartUseCases = new CartUseCases({
            cartRepository: mockCartRepository,
            productModel: {},
            orderUseCases: mockOrderUseCases
        });
    });

    describe('checkout', () => {
        it('nên tạo đơn hàng và xóa giỏ hàng', async () => {
            const cart = { customerId: 'c1', items: [{ productId: 'p1', quantity: 1 }] };
            mockCartRepository.findByCustomerId.mockResolvedValue(cart);
            mockOrderUseCases.createOrder.mockResolvedValue({ _id: 'o1' });

            const result = await cartUseCases.checkout('c1', 't1');

            expect(mockOrderUseCases.createOrder).toHaveBeenCalled();
            expect(mockCartRepository.deleteByCustomerId).toHaveBeenCalledWith('c1');
            expect(result._id).toBe('o1');
        });

        it('nên ném lỗi nếu giỏ hàng trống', async () => {
            mockCartRepository.findByCustomerId.mockResolvedValue({ items: [] });

            await expect(cartUseCases.checkout('c1', 't1'))
                .rejects.toThrow('Giỏ hàng trống, không thể thanh toán');
        });
    });
});
