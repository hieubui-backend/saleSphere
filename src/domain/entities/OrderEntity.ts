import OrderStatusEnum, { OrderStatus } from '../enums/OrderStatusEnum';
import OrderStateMachine from '../services/OrderStateMachine';
import ShippingCalculator from '../services/ShippingCalculator';
import ProductEntity from './ProductEntity';

export interface OrderItem {
    product: string;
    name: string;
    price: number;
    quantity: number;
}

export interface OrderEntityProps {
    id?: string;
    customerId: string;
    shippingAddress: string;
    region?: string;
    paymentMethod?: string;
    items?: OrderItem[];
    subtotal?: number;
    shippingFee?: number;
    totalAmount?: number;
    status?: string;
    paymentStatus?: string;
    orderCode?: number;
    paymentTransactionId?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
}

/**
 * OrderEntity Entity - Rich Domain Model
 * Chứa logic tính tổng tiền, thuế, phí ship và quản lý trạng thái.
 */
export default class OrderEntity {
    public id?: string;
    public customerId: string;
    public items: OrderItem[];
    public subtotal: number;
    public shippingFee: number;
    public totalAmount: number;
    public status: string;
    public paymentStatus: string;
    public paymentMethod: string;
    public shippingAddress: string;
    public region: string;
    public orderCode?: number;
    public paymentTransactionId?: string;
    public createdAt?: Date | string;
    public updatedAt?: Date | string;

    constructor({ customerId, shippingAddress, region, paymentMethod, items = [], subtotal = 0, shippingFee = 0, totalAmount = 0, status, paymentStatus = 'pending', orderCode, paymentTransactionId, createdAt, updatedAt }: OrderEntityProps) {
        this.customerId = customerId;
        this.items = items;
        this.subtotal = subtotal;
        this.shippingFee = shippingFee;
        this.totalAmount = totalAmount;
        this.status = status || OrderStatus.PENDING;
        this.paymentStatus = paymentStatus;
        this.paymentMethod = paymentMethod || 'cod';
        this.shippingAddress = shippingAddress;
        this.region = region || 'DEFAULT';
        this.orderCode = orderCode;
        this.paymentTransactionId = paymentTransactionId;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        
        if (this.items.length === 0) {
            this.calculateShippingFee();
        }
    }

    /**
     * Thêm sản phẩm vào đơn hàng
     * @param productEntity Domain Entity ProductEntity
     * @param quantity 
     */
    public addItem(productEntity: ProductEntity, quantity: number): void {
        productEntity.deductStock(quantity);
        
        const item: OrderItem = {
            product: productEntity.id!,
            name: productEntity.name,
            price: productEntity.price,
            quantity: quantity
        };
        
        this.items.push(item);
        this.calculateTotals();
    }

    /**
     * Tính phí vận chuyển dựa trên region
     */
    public calculateShippingFee(): void {
        this.shippingFee = ShippingCalculator.calculateFee(this.region);
        this.calculateTotals();
    }

    /**
     * Tính toán lại subtotal và totalAmount
     */
    public calculateTotals(): void {
        this.subtotal = this.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        this.totalAmount = this.subtotal + this.shippingFee;
    }

    /**
     * Chuyển trạng thái đơn hàng (Có validate)
     * @param nextStatus 
     */
    public changeStatus(nextStatus: string): void {
        OrderStateMachine.validateTransition(this.status, nextStatus);
        this.status = nextStatus;
    }

    /**
     * Cập nhật trạng thái thanh toán
     * @param status 
     */
    public updatePaymentStatus(status: string): void {
        this.paymentStatus = status;
    }
}
