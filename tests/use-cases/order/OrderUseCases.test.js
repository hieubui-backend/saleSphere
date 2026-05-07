const OrderUseCases = require('../../../src/application/use-cases/order/OrderUseCases');
const mongoose = require('mongoose');

jest.mock('mongoose', () => ({
    startSession: jest.fn(),
    Types: {
        ObjectId: jest.fn(id => id)
    },
    isValidObjectId: jest.fn(() => true)
}));

describe('OrderUseCases', () => {
    let orderUseCases;
    let mockOrderRepository;
    let mockProductRepository;
    let mockCustomerRepository;
    let mockTenantRepository;
    let mockSession;

    beforeEach(() => {
        mockSession = {
            startTransaction: jest.fn(),
            commitTransaction: jest.fn(),
            abortTransaction: jest.fn(),
            endSession: jest.fn()
        };
        mongoose.startSession.mockResolvedValue(mockSession);

        mockOrderRepository = {
            create: jest.fn(),
            findById: jest.fn(),
            findOneAndUpdate: jest.fn(),
            findByIdAndUpdate: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            countDocuments: jest.fn()
        };
        mockProductRepository = {
            findOne: jest.fn(),
            updateOne: jest.fn(),
            findByIdAndUpdate: jest.fn()
        };
        mockCustomerRepository = {};
        mockTenantRepository = {};

        orderUseCases = new OrderUseCases({
            orderRepository: mockOrderRepository,
            productRepository: mockProductRepository,
            customerRepository: mockCustomerRepository,
            tenantRepository: mockTenantRepository
        });
    });

    describe('createOrder', () => {
        it('nên tạo đơn hàng và trừ kho thành công', async () => {
            const tenantId = 't1';
            const userId = 'u1';
            const items = [{ productId: 'p1', quantity: 2 }];
            const product = { _id: 'p1', name: 'Product 1', price: 100, stock: 10, save: jest.fn() };
            
            mockProductRepository.findOne.mockResolvedValue(product);
            mockOrderRepository.create.mockImplementation((data) => Promise.resolve(data));

            const result = await orderUseCases.createOrder(tenantId, userId, { items });

            expect(product.stock).toBe(8);
            expect(product.save).toHaveBeenCalledWith({ session: mockSession });
            expect(mockOrderRepository.create).toHaveBeenCalled();
            expect(mockSession.commitTransaction).toHaveBeenCalled();
            expect(result.totalAmount).toBe(200);
        });

        it('nên ném lỗi nếu không đủ hàng trong kho', async () => {
            const items = [{ productId: 'p1', quantity: 20 }];
            const product = { _id: 'p1', name: 'Product 1', stock: 10 };
            mockProductRepository.findOne.mockResolvedValue(product);

            await expect(orderUseCases.createOrder('t1', 'u1', { items }))
                .rejects.toThrow('Sản phẩm Product 1 không đủ hàng trong kho');
            
            expect(mockSession.abortTransaction).toHaveBeenCalled();
        });
    });

    describe('restockProducts', () => {
        it('nên gọi productRepository.findByIdAndUpdate để cộng lại kho', async () => {
            const order = {
                items: [
                    { product: 'p1', quantity: 2 },
                    { productId: 'p2', quantity: 3 }
                ]
            };

            await orderUseCases.restockProducts(order);

            expect(mockProductRepository.findByIdAndUpdate).toHaveBeenCalledTimes(2);
            expect(mockProductRepository.findByIdAndUpdate).toHaveBeenCalledWith('p1', {
                $inc: { stock: 2 }
            });
        });
    });
});
