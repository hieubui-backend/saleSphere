const OrderStateMachine = require('../../src/domain/services/OrderStateMachine');
const OrderStatusEnum = require('../../src/domain/enums/OrderStatusEnum');

describe('OrderStateMachine', () => {
    it('should allow valid transitions', () => {
        expect(OrderStateMachine.canTransition(OrderStatusEnum.PENDING, OrderStatusEnum.PROCESSING)).toBe(true);
        expect(OrderStateMachine.canTransition(OrderStatusEnum.PROCESSING, OrderStatusEnum.SHIPPING)).toBe(true);
        expect(OrderStateMachine.canTransition(OrderStatusEnum.SHIPPING, OrderStatusEnum.COMPLETED)).toBe(true);
    });

    it('should prevent invalid transitions', () => {
        expect(OrderStateMachine.canTransition(OrderStatusEnum.SHIPPING, OrderStatusEnum.PENDING)).toBe(false);
        expect(OrderStateMachine.canTransition(OrderStatusEnum.COMPLETED, OrderStatusEnum.PROCESSING)).toBe(false);
        expect(OrderStateMachine.canTransition(OrderStatusEnum.CANCELLED, OrderStatusEnum.PENDING)).toBe(false);
    });

    it('should throw error on invalid transition using validateTransition', () => {
        expect(() => {
            OrderStateMachine.validateTransition(OrderStatusEnum.PENDING, OrderStatusEnum.SHIPPING);
        }).toThrow(/Không thể chuyển trạng thái đơn hàng/);
    });

    it('should not throw error on valid transition using validateTransition', () => {
        expect(() => {
            OrderStateMachine.validateTransition(OrderStatusEnum.PENDING, OrderStatusEnum.PROCESSING);
        }).not.toThrow();
    });
});
