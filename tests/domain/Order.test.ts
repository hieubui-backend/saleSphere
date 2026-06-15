import OrderEntity from '../../src/domain/entities/OrderEntity';
import ProductEntity from '../../src/domain/entities/ProductEntity';
import OrderStatusEnum, { OrderStatus } from '../../src/domain/enums/OrderStatusEnum';

describe('OrderEntity Entity', () => {
    let customerId: string, shippingAddress: string, region: string, paymentMethod: string;

    beforeEach(() => {
        customerId = 'user123';
        shippingAddress = '123 Test St';
        region = 'HA_NOI';
        paymentMethod = 'cod';
    });

    it('should initialize with correct totals and shipping fee', () => {
        const order = new OrderEntity({ customerId, shippingAddress, region, paymentMethod });
        
        expect(order.shippingFee).toBe(20000); // Hà Nội
        expect(order.subtotal).toBe(0);
        expect(order.totalAmount).toBe(20000);
        expect(order.status).toBe(OrderStatus.PENDING);
    });

    it('should add items and update totals correctly', () => {
        const order = new OrderEntity({ customerId, shippingAddress: { recipientName: 'test', phone: '123', street: '123', ward: 'W', district: 'D', province: 'P' }, region, paymentMethod });
        const product = new ProductEntity({ id: 'p1', name: 'Prod 1', price: 100000, variants: [{ _id: 'v1', color: 'Red', size: 'M', stock: 10, additionalPrice: 0 }] });

        order.addItem(product, 2, 'v1');

        expect(order.items.length).toBe(1);
        expect(product.getTotalStock()).toBe(8); // Stock deducted
        expect(order.subtotal).toBe(200000);
        expect(order.totalAmount).toBe(220000); // 200k + 20k ship
    });

    it('should allow valid status changes', () => {
        const order = new OrderEntity({ customerId, shippingAddress, region, paymentMethod });
        order.changeStatus(OrderStatus.PROCESSING);
        expect(order.status).toBe(OrderStatus.PROCESSING);
    });

    it('should throw error for invalid status changes', () => {
        const order = new OrderEntity({ customerId, shippingAddress, region, paymentMethod });
        expect(() => order.changeStatus(OrderStatus.COMPLETED)).toThrow();
    });
});





