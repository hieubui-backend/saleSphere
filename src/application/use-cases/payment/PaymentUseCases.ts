import mongoose from 'mongoose';
import OrderEntity from '../../../domain/entities/OrderEntity';
import { IOrderRepository } from '../../../domain/repositories/IOrderRepository';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import PayOSGateway from '../../../infrastructure/payment/PayOSGateway';
import VNPayGateway from '../../../infrastructure/payment/VNPayGateway';
import EmailService from '../../../infrastructure/services/EmailService';
import EmailQueue from '../../../infrastructure/queue/EmailQueue';
import config from '../../../config/config';


export default class PaymentUseCases {
    private orderRepository: IOrderRepository;
    private userRepository: IUserRepository;
    private emailService: EmailService;
    private emailQueue: EmailQueue;
    private payOSGateway: PayOSGateway;

    private vnPayGateway: VNPayGateway;

    constructor({ orderRepository, userRepository, emailService, emailQueue, payOSGateway, vnPayGateway }: { 
        orderRepository: IOrderRepository, 
        userRepository: IUserRepository,
        emailService: EmailService,
        emailQueue: EmailQueue,
        payOSGateway: PayOSGateway,

        vnPayGateway: VNPayGateway 
    }) {
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.emailQueue = emailQueue;
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
    public async handlePayOSWebhook(body: any, io?: any): Promise<OrderEntity | null> {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const webhookData = this.payOSGateway.verifyWebhookData(body);
            const orderCode = webhookData.orderCode;
            const transactionId = webhookData.reference; // Đây là mã giao dịch duy nhất từ PayOS
            
            const order = await this.orderRepository.findByOrderCode(orderCode, { session });
            if (!order) {
                await session.abortTransaction();
                return null;
            }

            // KIỂM TRA IDEMPOTENCY:
            // 1. Nếu đơn hàng đã được đánh dấu là 'paid'
            // 2. Hoặc nếu mã giao dịch này đã được xử lý trước đó
            if (order.paymentStatus === 'paid' || order.paymentTransactionId === transactionId) {
                console.log(`Webhook trùng lặp được phát hiện cho OrderCode: ${orderCode}, TransactionId: ${transactionId}. Bỏ qua.`);
                await session.commitTransaction(); // Trả về thành công để PayOS không gửi lại
                return order;
            }

            // Kiểm tra trạng thái thanh toán từ PayOS
            if (webhookData.status === 'PAID' || webhookData.desc === 'success') {
                order.updatePaymentStatus('paid');
                order.paymentTransactionId = transactionId; // Lưu vết mã giao dịch
                
                const updatedOrder = await this.orderRepository.save(order, { session });
                await session.commitTransaction();

                // GỬI EMAIL XÁC NHẬN QUA MESSAGE QUEUE (BULLMQ)
                this.addOrderConfirmationToQueue(updatedOrder!);

                if (io) {
                    io.emit('orderUpdate', { 
                        orderId: updatedOrder!.id || (updatedOrder as any)._id, 
                        status: updatedOrder!.status, 
                        paymentStatus: 'paid' 
                    });
                }

                return updatedOrder;
            }
            
            await session.abortTransaction();
            return null;
        } catch (error) {
            await session.abortTransaction();
            console.error("PaymentUseCases handlePayOSWebhook Error:", error);
            return null;
        } finally {
            session.endSession();
        }
    }

    /**
     * Thêm job gửi email vào queue
     */
    private async addOrderConfirmationToQueue(order: OrderEntity): Promise<void> {
        try {
            const user = await this.userRepository.findById(order.customerId);
            if (user && user.email) {
                await this.emailQueue.addOrderConfirmationJob(user.email, order);
            }
        } catch (error) {
            console.error("Error adding order confirmation job to queue:", error);
        }
    }

    /**
     * Xử lý VNPay Return
     */
    public async handleVnPayReturn(query: any): Promise<string | null> {
        const isVerified = this.vnPayGateway.verifyReturn(query);

        if (isVerified.isSuccess) {
            const orderId = query.vnp_TxnRef as string;
            const order = await this.orderRepository.findById(orderId);
            if (order && order.paymentStatus !== 'paid') {
                order.updatePaymentStatus('paid');
                await this.orderRepository.save(order);
            }
            return orderId;
        }
        return null;
    }

    /**
     * Xử lý VNPay IPN
     */
    public async handleVnPayIpn(query: any): Promise<{ RspCode: string, Message: string }> {
        try {
            const isVerified = this.vnPayGateway.verifyIpn(query);

            if (isVerified.isSuccess) {
                const orderId = query.vnp_TxnRef as string;
                const order = await this.orderRepository.findById(orderId);
                if (order && order.paymentStatus !== 'paid') {
                    order.updatePaymentStatus('paid');
                    await this.orderRepository.save(order);
                }
                return { RspCode: '00', Message: 'Confirm Success' };
            } else {
                return { RspCode: '97', Message: 'Checksum failed' };
            }
        } catch (error) {
            return { RspCode: '99', Message: 'Unknown error' };
        }
    }

    /**
     * Xử lý PayOS Return
     */
    public async handlePayOSReturn(query: any, io?: any): Promise<boolean> {
        const { orderCode, cancel } = query;

        // Nếu người dùng hủy
        if (cancel === 'true') {
            return false;
        }

        if (orderCode) {
            try {
                // Gọi API PayOS để lấy trạng thái thực sự của đơn hàng
                // Việc này thay thế cho việc kiểm tra chữ ký (Signature)
                // và đảm bảo thông tin trả về là chính xác từ PayOS, không thể bị giả mạo qua query
                const paymentInfo = await this.payOSGateway.getPaymentLinkInformation(orderCode);
                
                if (paymentInfo && paymentInfo.status === 'PAID') {
                    const order = await this.orderRepository.findByOrderCode(Number(orderCode));

                    if (order && order.paymentStatus !== 'paid') {
                        order.updatePaymentStatus('paid');
                        const updatedOrder = await this.orderRepository.save(order);
                        const oId = updatedOrder!.id || (updatedOrder as any)._id;
                        console.log(`✅ [PayOS Return] Đã cập nhật paymentStatus thành 'paid' qua API verify cho đơn hàng ${oId}`);
                        
                        if (io) {
                            io.emit('orderUpdate', { 
                                orderId: oId, 
                                status: order.status, 
                                paymentStatus: 'paid' 
                            });
                        }
                    }
                    return true;
                }
            } catch (error) {
                console.error("Lỗi khi xác minh thông tin thanh toán PayOS:", error);
                return false;
            }
        }
        
        return false;
    }
}

