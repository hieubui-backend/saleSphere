const OrderStatusEnum = require('../enums/OrderStatusEnum');
const OrderStateMachine = require('../services/OrderStateMachine');
const ShippingCalculator = require('../services/ShippingCalculator');

/**
 * Order Entity - Rich Domain Model
 * Chứa logic tính tổng tiền, thuế, phí ship và quản lý trạng thái.
 */
class Order {
    constructor({ customerId, shippingAddress, region, paymentMethod }) {
        this.customerId = customerId;
        this.items = [];
        this.subtotal = 0;
        this.shippingFee = 0;
        this.totalAmount = 0;
        this.status = OrderStatusEnum.PENDING;
        this.paymentStatus = 'pending';
        this.paymentMethod = paymentMethod || 'cod';
        this.shippingAddress = shippingAddress;
        this.region = region || 'DEFAULT';
        
        // Khởi tạo phí ship ngay khi tạo order
        this.calculateShippingFee();
    }

    /**
     * Thêm sản phẩm vào đơn hàng
     * @param {Product} productEntity Domain Entity Product
     * @param {number} quantity 
     */
    addItem(productEntity, quantity) {
        // Thực hiện logic trừ kho ngay tại Domain
        productEntity.deductStock(quantity);
        
        const item = {
            product: productEntity.id,
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
    calculateShippingFee() {
        this.shippingFee = ShippingCalculator.calculateFee(this.region);
        this.calculateTotals();
    }

    /**
     * Tính toán lại subtotal và totalAmount
     */
    calculateTotals() {
        this.subtotal = this.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        this.totalAmount = this.subtotal + this.shippingFee;
    }

    /**
     * Chuyển trạng thái đơn hàng (Có validate)
     * @param {string} nextStatus 
     */
    changeStatus(nextStatus) {
        OrderStateMachine.validateTransition(this.status, nextStatus);
        this.status = nextStatus;
    }

    /**
     * Cập nhật trạng thái thanh toán
     * @param {string} status 
     */
    updatePaymentStatus(status) {
        this.paymentStatus = status;
    }
}

module.exports = Order;
