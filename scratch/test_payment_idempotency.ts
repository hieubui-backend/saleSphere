import mongoose from 'mongoose';
import OrderModel from '../src/infrastructure/database/models/order.model';
import OrderRepository from '../src/infrastructure/repositories/OrderRepository';
import PaymentUseCases from '../src/application/use-cases/payment/PaymentUseCases';
import PayOSGateway from '../src/infrastructure/payment/PayOSGateway';
import config from '../src/config/config';

async function testPaymentIdempotency() {
    await mongoose.connect(config.mongoUri);
    
    const orderRepo = new OrderRepository({ orderModel: OrderModel });
    // Mock PayOSGateway
    const mockPayOSGateway = {
        verifyWebhookData: (body: any) => body // Trả về chính body để test dễ
    } as any;

    const paymentUseCases = new PaymentUseCases({ 
        orderRepository: orderRepo, 
        payOSGateway: mockPayOSGateway,
        vnPayGateway: {} as any 
    });

    const orderCode = 123456;
    const transactionId = "TXN_999999";

    // 1. Tạo đơn hàng mẫu
    await OrderModel.deleteMany({ orderCode }); // Dọn trước
    const orderDoc = await OrderModel.create({
        orderCode,
        customerId: new mongoose.Types.ObjectId(), // Bổ sung customerId giả
        totalAmount: 100000,
        paymentStatus: 'pending',
        status: 'pending',
        items: [],
        region: 'DEFAULT'
    });

    console.log(`Đơn hàng tạo mới: Code ${orderCode}, Status: ${orderDoc.paymentStatus}`);

    // 2. Giả lập Webhook lần 1
    const webhookBody = {
        orderCode,
        reference: transactionId,
        status: 'PAID'
    };

    console.log('--- Gọi Webhook lần 1 ---');
    const result1 = await paymentUseCases.handlePayOSWebhook(webhookBody);
    console.log(`Kết quả Lần 1: ${result1?.paymentStatus}, TransactionId: ${result1?.paymentTransactionId}`);

    // 3. Giả lập Webhook lần 2 (Trùng lặp)
    console.log('--- Gọi Webhook lần 2 (Trùng lặp) ---');
    const result2 = await paymentUseCases.handlePayOSWebhook(webhookBody);
    
    // Kiểm tra log "Webhook trùng lặp được phát hiện" trong console
    console.log(`Kết quả Lần 2: ${result2?.paymentStatus}, TransactionId: ${result2?.paymentTransactionId}`);

    if (result1?.paymentTransactionId === result2?.paymentTransactionId) {
        console.log('✅ TEST PASSED: Idempotency hoạt động đúng!');
    } else {
        console.log('❌ TEST FAILED: Có lỗi trong xử lý trùng lặp.');
    }

    // Dọn dẹp
    await OrderModel.deleteOne({ _id: orderDoc._id });
    await mongoose.disconnect();
}

testPaymentIdempotency();
