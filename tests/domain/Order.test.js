const Order = require('../../src/domain/entities/Order');
const Product = require('../../src/domain/entities/Product');
const OrderStatusEnum = require('../../src/domain/enums/OrderStatusEnum');

describe('Order Entity', () => {
    let customerId, shippingAddress, region, paymentMethod;

    beforeEach(() => {
        customerId = 'user123';
        shippingAddress = '123 Test St';
        region = 'HA_NOI';
        paymentMethod = 'cod';
    });

    it('should initialize with correct totals and shipping fee', () => {
        const order = new Order({ customerId, shippingAddress, region, paymentMethod });
        
        expect(order.shippingFee).toBe(20000); // Hà Nội
        expect(order.subtotal).toBe(0);
        expect(order.totalAmount).toBe(20000);
        expect(order.status).toBe(OrderStatusEnum.PENDING);
    });

    it('should add items and update totals correctly', () => {
        const order = new Order({ customerId, shippingAddress, region, paymentMethod });
        const product = new Product({ id: 'p1', name: 'Prod 1', price: 100000, stock: 10 });

        order.addItem(product, 2);

        expect(order.items.length).toBe(1);
        expect(product.stock).toBe(8); // Stock deducted
        expect(order.subtotal).toBe(200000);
        expect(order.totalAmount).toBe(220000); // 200k + 20k ship
    });

    it('should allow valid status changes', () => {
        const order = new Order({ customerId, shippingAddress, region, paymentMethod });
        order.changeStatus(OrderStatusEnum.PROCESSING);
        expect(order.status).toBe(OrderStatusEnum.PROCESSING);
    });

    it('should throw error for invalid status changes', () => {
        const order = new Order({ customerId, shippingAddress, region, paymentMethod });
        expect(() => order.changeStatus(OrderStatusEnum.COMPLETED)).toThrow();
    });
});
