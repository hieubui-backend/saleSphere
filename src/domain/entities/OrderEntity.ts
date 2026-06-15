import OrderStatusEnum, { OrderStatus } from '../enums/OrderStatusEnum';
import OrderStateMachine from '../services/OrderStateMachine';
import ShippingCalculator from '../services/ShippingCalculator';
import ProductEntity from './ProductEntity';

export interface OrderItem {
    product: string;
    name: string;
    price: number;          // Snapshot giá tại thời điểm mua
    quantity: number;
    // Snapshot variant tại thời điểm mua (bất biến sau khi đặt hàng)
    variantInfo?: {
        color?: string;
        size?: string;
        sku?: string;
    };
}

export interface OrderShippingAddress {
    recipientName: string;
    phone: string;
    street: string;
    ward: string;
    district: string;
    province: string;
    fullAddress?: string;   // Denormalized: 'Số 5, Nguyễn Huệ, P.Bến Nghé, Q.1, TP.HCM'
}

export interface OrderEntityProps {
    id?: string;
    customerId: string;
    shippingAddress: OrderShippingAddress | string; // Hỗ trợ cả 2 để backward compatible
    region?: string;
    paymentMethod?: string;
    items?: OrderItem[];
    subtotal?: number;
    shippingFee?: number;
    discountAmount?: number;    // Số tiền giảm từ coupon
    totalAmount?: number;
    couponCode?: string;        // Mã coupon đã áp dụng
    status?: string;
    paymentStatus?: string;
    orderCode?: number;
    paymentTransactionId?: string;
    note?: string;              // Ghi chú của khách hàng
    cancelReason?: string;
    cancelledAt?: Date;
    createdAt?: Date | string;
    updatedAt?: Date | string;
}

/**
 * OrderEntity — Rich Domain Model
 * Chứa logic tính tổng tiền, phí ship, coupon và quản lý trạng thái.
 */
export default class OrderEntity {
    public id?: string;
    public customerId: string;
    public items: OrderItem[];
    public subtotal: number;
    public shippingFee: number;
    public discountAmount: number;
    public totalAmount: number;
    public status: string;
    public paymentStatus: string;
    public paymentMethod: string;
    public shippingAddress: OrderShippingAddress | string;
    public region: string;
    public couponCode?: string;
    public orderCode?: number;
    public paymentTransactionId?: string;
    public note?: string;
    public cancelReason?: string;
    public cancelledAt?: Date;
    public createdAt?: Date | string;
    public updatedAt?: Date | string;

    constructor(props: OrderEntityProps) {
        this.id = props.id;
        this.customerId = props.customerId;
        this.items = props.items ?? [];
        this.subtotal = props.subtotal ?? 0;
        this.shippingFee = props.shippingFee ?? 0;
        this.discountAmount = props.discountAmount ?? 0;
        this.totalAmount = props.totalAmount ?? 0;
        this.status = props.status ?? OrderStatus.PENDING;
        this.paymentStatus = props.paymentStatus ?? 'pending';
        this.paymentMethod = props.paymentMethod ?? 'cod';
        this.shippingAddress = props.shippingAddress;
        this.region = props.region ?? 'DEFAULT';
        this.couponCode = props.couponCode;
        this.orderCode = props.orderCode;
        this.paymentTransactionId = props.paymentTransactionId;
        this.note = props.note;
        this.cancelReason = props.cancelReason;
        this.cancelledAt = props.cancelledAt;
        this.createdAt = props.createdAt;
        this.updatedAt = props.updatedAt;

        if (this.items.length === 0) {
            this.calculateShippingFee();
        }
    }

    /**
     * Thêm sản phẩm vào đơn hàng (có snapshot variant info)
     */
    public addItem(productEntity: ProductEntity, quantity: number, variantId?: string): void {
        productEntity.deductStock(quantity, variantId);

        const variant = variantId
            ? productEntity.variants.find(v => v._id === variantId)
            : undefined;

        const item: OrderItem = {
            product: productEntity.id!,
            name: productEntity.name,
            price: productEntity.getEffectivePrice(variantId),
            quantity,
            variantInfo: variant ? {
                color: variant.color,
                size: variant.size,
                sku: variant.sku,
            } : undefined,
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
     * Tính toán lại subtotal và totalAmount (có tính coupon discount)
     */
    public calculateTotals(): void {
        this.subtotal = this.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        this.totalAmount = Math.max(0, this.subtotal + this.shippingFee - this.discountAmount);
    }

    /**
     * Áp dụng coupon
     */
    public applyCoupon(couponCode: string, discountAmount: number): void {
        this.couponCode = couponCode;
        this.discountAmount = discountAmount;
        this.calculateTotals();
    }

    /**
     * Chuyển trạng thái đơn hàng (có validate state machine)
     */
    public changeStatus(nextStatus: string): void {
        OrderStateMachine.validateTransition(this.status, nextStatus);
        this.status = nextStatus;
        if (nextStatus === OrderStatus.CANCELLED) {
            this.cancelledAt = new Date();
        }
    }

    /**
     * Huỷ đơn hàng
     */
    public cancel(reason: string): void {
        this.changeStatus(OrderStatus.CANCELLED);
        this.cancelReason = reason;
    }

    /**
     * Cập nhật trạng thái thanh toán
     */
    public updatePaymentStatus(status: string): void {
        this.paymentStatus = status;
    }
}
