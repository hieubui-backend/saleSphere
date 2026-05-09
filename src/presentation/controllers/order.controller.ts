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
    const { orderUseCases } = req.container.cradle;
    const order = await orderUseCases.createOrder(user?.id || user?._id, req.body);
    
    if (order) emitOrderUpdate(req, { orderId: (order as any).id || (order as any)._id, status: 'pending' });
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
    const customerId = req.session.customer?._id || (req as any).user?._id;
    if (!customerId) {
        res.status(401).json({ success: false, message: 'Vui long dang nhap' });
        return;
    }

    const { orderRepository } = req.container.cradle;
    const orders = await orderRepository.findByCustomerId(customerId);

    res.status(200).json({ success: true, data: orders });
});
