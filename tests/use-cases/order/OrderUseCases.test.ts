import OrderUseCases from '../../../src/application/use-cases/order/OrderUseCases';
import mongoose from 'mongoose';

jest.mock('mongoose', () => ({
    startSession: jest.fn(),
    Types: {
        ObjectId: jest.fn(id => id)
    },
    isValidObjectId: jest.fn(() => true)
}));

describe('OrderUseCases', () => {
    let orderUseCases: OrderUseCases;
    let mockOrderRepository: any;
    let mockProductRepository: any;
    let mockCustomerRepository: any;
    let mockSession: any;

    beforeEach(() => {
        mockSession = {
            startTransaction: jest.fn(),
            commitTransaction: jest.fn(),
            abortTransaction: jest.fn(),
            endSession: jest.fn()
        };
        (mongoose.startSession as jest.Mock).mockResolvedValue(mockSession);

        mockOrderRepository = {
            create: jest.fn(),
            findById: jest.fn(),
            save: jest.fn(),
            getDashboardStats: jest.fn(),
            findAll: jest.fn()
        };
        mockProductRepository = {
            findById: jest.fn(),
            updateById: jest.fn(),
            decrementStock: jest.fn().mockResolvedValue(true)  // Atomic stock decrement
        };
        mockCustomerRepository = {};

        orderUseCases = new OrderUseCases({
            orderRepository: mockOrderRepository,
            productRepository: mockProductRepository,
            customerRepository: mockCustomerRepository
        });
    });

    describe('createOrder', () => {
        it('nên tạo đơn hàng và trừ kho thành công', async () => {
            const userId = 'u1';
            const items = [{ productId: 'p1', quantity: 2, variantId: 'v1' }];
            const product = { 
                id: 'p1', 
                name: 'ProductEntity 1', 
                price: 100, 
                getEffectivePrice: () => 100,
                getTotalStock: () => 10,
                variants: [{ _id: 'v1', color: 'Red', size: 'M', stock: 10, additionalPrice: 0 }],
                deductStock: jest.fn()
            };
            
            mockProductRepository.findById.mockResolvedValue(product);
            mockOrderRepository.create.mockImplementation((order: any) => Promise.resolve(order));

            const result = await orderUseCases.createOrder(userId, { items, shippingAddress: 'Addr', region: 'HA_NOI' });

            expect(mockProductRepository.decrementStock).toHaveBeenCalledWith('p1', 2, 'v1', mockSession);
            expect(mockOrderRepository.create).toHaveBeenCalled();
            expect(mockSession.commitTransaction).toHaveBeenCalled();
            expect(result!.totalAmount).toBe(20200); // 2 * 100 + 20000 ship
        });

        it('nên ném lỗi nếu không đủ hàng trong kho', async () => {
            const items = [{ productId: 'p1', quantity: 20, variantId: 'v1' }];
            const product = { 
                id: 'p1', 
                name: 'ProductEntity 1', 
                getTotalStock: () => 10,
                getEffectivePrice: () => 100,
                variants: [{ _id: 'v1', color: 'Red', size: 'M', stock: 10, additionalPrice: 0 }],
                deductStock: jest.fn().mockImplementation(() => { throw new Error('không đủ hàng'); })
            };
            mockProductRepository.findById.mockResolvedValue(product);
            // decrementStock trả về false – simulate hết hàng
            mockProductRepository.decrementStock.mockResolvedValue(false);

            await expect(orderUseCases.createOrder('u1', { items, shippingAddress: 'Addr' }))
                .rejects.toThrow('không đủ số lượng');
            
            expect(mockSession.abortTransaction).toHaveBeenCalled();
        });
    });

    describe('restockProducts', () => {
        it('nên gọi productRepository.updateById để cộng lại kho', async () => {
            const order = {
                items: [
                    { product: 'p1', quantity: 2 },
                    { product: 'p2', quantity: 3 }
                ]
            } as any;

            const product1 = { id: 'p1', addStock: jest.fn() };
            const product2 = { id: 'p2', addStock: jest.fn() };

            mockProductRepository.findById.mockResolvedValueOnce(product1).mockResolvedValueOnce(product2);

            await orderUseCases.restockProducts(order);

            expect(mockProductRepository.findById).toHaveBeenCalledTimes(2);
            expect(product1.addStock).toHaveBeenCalledWith(2);
            expect(product2.addStock).toHaveBeenCalledWith(3);
            expect(mockProductRepository.updateById).toHaveBeenCalledTimes(2);
        });
    });
});





