import OrderEntity from '../entities/OrderEntity';

export interface IOrderRepository {
    create(orderEntity: OrderEntity, options?: any): Promise<OrderEntity | null>;
    findById(id: string): Promise<OrderEntity | null>;
    findByCustomerId(customerId: string): Promise<OrderEntity[]>;
    findAll(query?: any): Promise<OrderEntity[]>;
    save(orderEntity: OrderEntity, options?: any): Promise<OrderEntity | null>;
    getDashboardStats(): Promise<any>;
    findByOrderCode(orderCode: number, options?: any): Promise<OrderEntity | null>;
}
