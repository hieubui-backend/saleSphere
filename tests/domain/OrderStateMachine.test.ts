import OrderStateMachine from '../../src/domain/services/OrderStateMachine';
import { OrderStatus } from '../../src/domain/enums/OrderStatusEnum';

describe('OrderStateMachine', () => {
    it('should allow valid transitions', () => {
        expect(OrderStateMachine.canTransition(OrderStatus.PENDING, OrderStatus.PROCESSING)).toBe(true);
        expect(OrderStateMachine.canTransition(OrderStatus.PROCESSING, OrderStatus.SHIPPING)).toBe(true);
        expect(OrderStateMachine.canTransition(OrderStatus.SHIPPING, OrderStatus.COMPLETED)).toBe(true);
    });

    it('should prevent invalid transitions', () => {
        expect(OrderStateMachine.canTransition(OrderStatus.SHIPPING, OrderStatus.PENDING)).toBe(false);
        expect(OrderStateMachine.canTransition(OrderStatus.COMPLETED, OrderStatus.PROCESSING)).toBe(false);
        expect(OrderStateMachine.canTransition(OrderStatus.CANCELLED, OrderStatus.PENDING)).toBe(false);
    });

    it('should throw error on invalid transition using validateTransition', () => {
        expect(() => {
            OrderStateMachine.validateTransition(OrderStatus.PENDING, OrderStatus.SHIPPING);
        }).toThrow(/Không thể chuyển trạng thái đơn hàng/);
    });

    it('should not throw error on valid transition using validateTransition', () => {
        expect(() => {
            OrderStateMachine.validateTransition(OrderStatus.PENDING, OrderStatus.PROCESSING);
        }).not.toThrow();
    });
});





