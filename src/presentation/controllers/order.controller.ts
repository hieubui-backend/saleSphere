import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';

const emitOrderUpdate = (req: Request, data: any) => {
    const io = req.app.get('socketio');
    if (io) {
        io.emit('orderUpdate', data);
        io.emit('statsUpdate', {});
        
        const urgentStatuses = ['dispute_escalated'];
        if (urgentStatuses.includes(data.status)) {
            io.emit('newDisputeAlert', {
                message: `Can xu ly don hang #${data.orderId.toString().slice(-6).toUpperCase()}`,
                ...data
            });
        }
    }
};

export const createOrder = asyncHandler(async (req: Request, res: Response) => {
    const user = req.session?.user || req.user;
    const userId = user?.id || user?._id;
    const { orderUseCases, cartRepository } = req.container.cradle;
    
    const order = await orderUseCases.createOrder(userId, req.body);
    
    if (order) {
        emitOrderUpdate(req, { orderId: (order as any).id || (order as any)._id, status: 'pending' });
        
        // Xóa giỏ hàng của user sau khi tạo đơn hàng thành công
        if (cartRepository) {
            const cart = await cartRepository.findByCustomerId(userId);
            if (cart) {
                cart.items = [];
                await cartRepository.save(cart);
            }
        }
    }
    res.status(201).json({ success: true, data: order });
});

export const handleLogisticsWebhook = asyncHandler(async (req: Request, res: Response) => {
    const { order_id, status, partner, tracking_number } = req.body;
    const { orderUseCases } = req.container.cradle;
    
    const { order, finalStatus } = await orderUseCases.handleLogisticsWebhook(order_id, status, partner, tracking_number);

    emitOrderUpdate(req, { 
        orderId: order_id, 
        status: finalStatus, 
        message: `Logistics (${partner || 'Don vi van chuyen'}): ${status}`
    });

    res.status(200).json({ success: true, message: 'Webhook processed successfully' });
});

export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
    const { orderUseCases } = req.container.cradle;
    const data = await orderUseCases.getDashboardStats();
    res.status(200).json({ success: true, data });
});

export const getOrders = asyncHandler(async (req: Request, res: Response) => {
    const { orderUseCases } = req.container.cradle;
    const result = await orderUseCases.getOrders(req.query as any);
    res.status(200).json({ success: true, ...result });
});

export const getOrderById = asyncHandler(async (req: Request, res: Response) => {
    const { orderUseCases } = req.container.cradle;
    const order = await orderUseCases.getOrderById(req.params.id as string);

    if (!order) {
        res.status(404).json({ success: false, message: 'Khong tim thay don hang' });
        return;
    }

    res.status(200).json({ success: true, data: order });
});

export const processOrder = asyncHandler(async (req: Request, res: Response) => {
    const { orderUseCases } = req.container.cradle;
    const updatedOrder = await orderUseCases.updateOrderStatus(req.params.id as string, 'processing');
    emitOrderUpdate(req, { orderId: req.params.id as string, status: 'processing' });
    res.status(200).json({ success: true, data: updatedOrder });
});

export const shipOrder = asyncHandler(async (req: Request, res: Response) => {
    const { orderUseCases } = req.container.cradle;
    const updatedOrder = await orderUseCases.updateOrderStatus(req.params.id as string, 'shipping');
    emitOrderUpdate(req, { 
        orderId: req.params.id as string, 
        status: 'shipping', 
        message: 'Da giao cho don vi van chuyen' 
    });
    res.status(200).json({ success: true, data: updatedOrder });
});

export const completeOrder = asyncHandler(async (req: Request, res: Response) => {
    const { orderUseCases } = req.container.cradle;
    const updatedOrder = await orderUseCases.updateOrderStatus(req.params.id as string, 'completed');
    emitOrderUpdate(req, { orderId: req.params.id as string, status: 'completed' });
    res.status(200).json({ success: true, data: updatedOrder });
});

export const createDispute = asyncHandler(async (req: Request, res: Response) => {
    const orderId = req.params.id as string;
    const { reason } = req.body;
    const { orderUseCases } = req.container.cradle;
    
    // Gọi phương thức tạo khiếu nại từ lớp Use Case
    const order = await orderUseCases.createDispute(orderId, reason);
    
    if (order) {
        emitOrderUpdate(req, { 
            orderId, 
            status: 'dispute_escalated', 
            message: 'Khách hàng đã gửi khiếu nại' 
        });
    }
    
    res.status(200).json({ success: true, message: 'Gửi khiếu nại thành công.', data: order });
});

export const resolveDispute = asyncHandler(async (req: Request, res: Response) => {
    const { action, reason } = req.body; 
    const orderId = req.params.id as string;
    const { orderUseCases } = req.container.cradle;
    
    const order = await orderUseCases.resolveDispute(orderId, { action, response: reason });
    
    if (order) {
        emitOrderUpdate(req, { 
            orderId, 
            status: order.status, 
            message: 'Da xu ly khieu nai' 
        });
    }
    res.status(200).json({ success: true, message: 'Xu ly thanh cong.' });
});

export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
    const { orderId, status, note } = req.body;
    const user = req.session?.user || req.user;

    const { orderUseCases } = req.container.cradle;
    const updatedOrder = await orderUseCases.updateOrderStatus(orderId, status, note, user.name);

    if (updatedOrder && ['cancelled', 'returned', 'failed'].includes(status)) {
        await orderUseCases.restockProducts(updatedOrder);
    }

    emitOrderUpdate(req, { orderId, status });
    res.json({ success: true, data: updatedOrder });
});

export const cancelOrder = asyncHandler(async (req: Request, res: Response) => {
    const { orderUseCases } = req.container.cradle;
    await orderUseCases.cancelOrder(req.params.id as string);
    
    emitOrderUpdate(req, { orderId: req.params.id as string, status: 'cancelled' });
    res.status(200).json({ success: true, message: 'Don hang da duoc huy.' });
});

export const getCustomerOrders = asyncHandler(async (req: Request, res: Response) => {
    const customerId = req.session.customer?.id || req.session.customer?._id || (req as any).user?.id || (req as any).user?._id;
    if (!customerId) {
        res.status(401).json({ success: false, message: 'Vui long dang nhap' });
        return;
    }

    const { orderRepository } = req.container.cradle;
    const orders = await orderRepository.findByCustomerId(customerId);

    res.status(200).json({ success: true, data: orders });
});

export const getPaymentLink = asyncHandler(async (req: Request, res: Response) => {
    const { orderUseCases, vnPayGateway, payOSGateway } = req.container.cradle;
    const order = await orderUseCases.getOrderById(req.params.id as string);

    if (!order) {
        res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
        return;
    }

    if (order.paymentStatus === 'paid') {
        res.status(400).json({ success: false, message: 'Đơn hàng đã được thanh toán' });
        return;
    }

    let paymentUrl: string | null = null;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    if (order.paymentMethod === 'vnpay') {
        const ipAddr = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
        const returnUrl = process.env.VNPAY_RETURN_URL || 'http://localhost:5000/api/payment/vnpay/return';
        paymentUrl = vnPayGateway.createPaymentUrl(order.id!, order.totalAmount, ipAddr, returnUrl);
    } else if (order.paymentMethod === 'bank_transfer') {
        try {
            // Nếu chưa có orderCode thì tạo mới
            if (!order.orderCode) {
                (order as any).orderCode = Number(String(Date.now()).slice(-6) + Math.floor(Math.random() * 1000));
                await orderUseCases.saveOrder(order);
            }

            const serverUrl = process.env.SERVER_URL || 'http://localhost:5000';
            const paymentLink = await payOSGateway.createPaymentLink(
                order.id!,
                order.totalAmount,
                `Thanh toan don hang ${order.id}`,
                `${serverUrl}/api/payment/payos/return?orderId=${order.id}`,
                `${serverUrl}/api/payment/payos/cancel?orderId=${order.id}`
            );
            paymentUrl = paymentLink.checkoutUrl;
        } catch (err) {
            console.error("PayOS Error:", err);
        }
    }

    res.json({ success: true, paymentUrl });
});
