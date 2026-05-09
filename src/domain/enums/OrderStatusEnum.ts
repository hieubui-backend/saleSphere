export enum OrderStatus {
    PENDING = 'pending',
    PROCESSING = 'processing',
    SHIPPING = 'shipping',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
    FAILED = 'failed',
    RETURNED = 'returned',
    DISPUTE_ESCALATED = 'dispute_escalated'
}

export default class OrderStatusEnum {
    public static readonly PENDING = OrderStatus.PENDING;
    public static readonly PROCESSING = OrderStatus.PROCESSING;
    public static readonly SHIPPING = OrderStatus.SHIPPING;
    public static readonly COMPLETED = OrderStatus.COMPLETED;
    public static readonly CANCELLED = OrderStatus.CANCELLED;
    public static readonly FAILED = OrderStatus.FAILED;
    public static readonly RETURNED = OrderStatus.RETURNED;
    public static readonly DISPUTE_ESCALATED = OrderStatus.DISPUTE_ESCALATED;

    public static getAll(): string[] {
        return Object.values(OrderStatus);
    }
}





