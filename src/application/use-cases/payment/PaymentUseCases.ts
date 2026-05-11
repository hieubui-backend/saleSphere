import OrderEntity from '../../../domain/entities/OrderEntity';
import { IOrderRepository } from '../../../domain/repositories/IOrderRepository';
import PayOSGateway from '../../../infrastructure/payment/PayOSGateway';
import VNPayGateway from '../../../infrastructure/payment/VNPayGateway';
import config from '../../../config/config';

export default class PaymentUseCases {
    private orderRepository: IOrderRepository;
    private payOSGateway: PayOSGateway;
    private vnPayGateway: VNPayGateway;

    constructor({ orderRepository, payOSGateway, vnPayGateway }: { 
        orderRepository: IOrderRepository, 
        payOSGateway: PayOSGateway,
        vnPayGateway: VNPayGateway 
    }) {
        this.orderRepository = orderRepository;
        this.payOSGateway = payOSGateway;
        this.vnPayGateway = vnPayGateway;
    }

    /**
     * Tạo link thanh toán dựa trên phương thức
     */
    public async createPaymentSession(order: OrderEntity, ipAddr?: string): Promise<string | null> {
        const frontendUrl = config.corsOrigin !== '*' ? config.corsOrigin : 'http://localhost:5173';

        if (order.paymentMethod === 'vnpay') {
            const returnUrl = process.env.VNPAY_RETURN_URL || 'http://localhost:5000/api/payment/vnpay/return';
            return this.vnPayGateway.createPaymentUrl(order.id!, order.totalAmount, ipAddr || '127.0.0.1', returnUrl);
        }

        if (order.paymentMethod === 'bank_transfer') {
            // Tạo orderCode duy nhất cho PayOS
            const orderCode = Number(String(Date.now()).slice(-6) + Math.floor(Math.random() * 1000));
            
            const serverUrl = process.env.SERVER_URL || 'http://localhost:5000';
            const paymentLink = await this.payOSGateway.createPaymentLink(
                order.id!,
                order.totalAmount,
                `Thanh toan don hang ${order.id}`,
                `${serverUrl}/api/payment/payos/return?orderId=${order.id}`,
                `${serverUrl}/api/payment/payos/cancel?orderId=${order.id}`
            );

            // Lưu orderCode vào đơn hàng để đối soát webhook
            order.orderCode = orderCode;
            await this.orderRepository.save(order);

            return paymentLink.checkoutUrl;
        }

        return null;
    }

    /**
     * Xử lý Webhook từ PayOS
     */
    public async handlePayOSWebhook(body: any): Promise<OrderEntity | null> {
        try {
            const webhookData = this.payOSGateway.verifyWebhookData(body);
            const orderCode = webhookData.orderCode;
            
            const order = await this.orderRepository.findByOrderCode(orderCode);
            if (!order) return null;

            // Kiểm tra trạng thái thanh toán từ PayOS
            if (webhookData.status === 'PAID' || webhookData.desc === 'success') {
                order.updatePaymentStatus('paid');
                return await this.orderRepository.save(order);
            }
            
            return null;
        } catch (error) {
            console.error("PaymentUseCases handlePayOSWebhook Error:", error);
            return null;
        }
    }
}
