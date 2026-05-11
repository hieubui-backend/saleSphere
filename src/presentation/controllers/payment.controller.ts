import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';

export const vnpayReturn = asyncHandler(async (req: Request, res: Response) => {
    const { vnPayGateway, orderUseCases } = req.container.cradle;
    const isVerified = vnPayGateway.verifyReturn(req.query);

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';

    if (isVerified.isSuccess) {
        const orderId = req.query.vnp_TxnRef as string;
        await orderUseCases.updatePaymentStatus(orderId, 'paid');
        res.redirect(`${clientUrl}/payment/success?orderId=${orderId}`);
    } else {
        res.redirect(`${clientUrl}/payment/failed`);
    }
});

export const vnpayIpn = asyncHandler(async (req: Request, res: Response) => {
    const { vnPayGateway, orderUseCases } = req.container.cradle;
    
    try {
        const isVerified = vnPayGateway.verifyIpn(req.query);

        if (isVerified.isSuccess) {
            const orderId = req.query.vnp_TxnRef as string;
            await orderUseCases.updatePaymentStatus(orderId, 'paid');
            res.status(200).json({ RspCode: '00', Message: 'Confirm Success' });
            return;
        } else {
            res.status(200).json({ RspCode: '97', Message: 'Checksum failed' });
            return;
        }
    } catch (error) {
        res.status(200).json({ RspCode: '99', Message: 'Unknown error' });
    }
});
export const payosWebhook = asyncHandler(async (req: Request, res: Response) => {
    const { paymentUseCases } = req.container.cradle;
    
    try {
        const order = await paymentUseCases.handlePayOSWebhook(req.body);
        
        if (order) {
            // Emit socket update để Admin Dashboard cập nhật thời gian thực
            const io = req.app.get('socketio');
            if (io) {
                io.emit('orderUpdate', { 
                    orderId: order.id, 
                    status: order.status, 
                    paymentStatus: 'paid' 
                });
            }
            res.status(200).json({ success: true });
        } else {
            res.status(400).json({ success: false, message: 'Webhook processing failed' });
        }
    } catch (error: any) {
        console.error("PayOS Webhook Error:", error);
        res.status(400).json({ success: false, message: error.message });
    }
});

export const payosReturn = asyncHandler(async (req: Request, res: Response) => {
    const { status, orderCode, orderId } = req.query;
    const clientUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173';

    try {
        if (status === 'PAID') {
            const { orderUseCases, orderRepository } = req.container.cradle;
            
            let order: any = null;
            if (orderId) {
                order = await orderUseCases.getOrderById(orderId as string);
            } else if (orderCode) {
                order = await orderRepository.findByOrderCode(Number(orderCode));
            }

            if (order && order.paymentStatus !== 'paid') {
                const oId = order.id || (order as any)._id;
                await orderUseCases.updatePaymentStatus(oId, 'paid');
                console.log(`✅ [PayOS Return] Đã cập nhật paymentStatus thành 'paid' cho đơn hàng ${oId}`);
                
                const io = req.app.get('socketio');
                if (io) {
                    io.emit('orderUpdate', { 
                        orderId: oId, 
                        status: order.status, 
                        paymentStatus: 'paid' 
                    });
                }
            }
            res.redirect(`${clientUrl}/customer-profile?payment=success`);
        } else {
            res.redirect(`${clientUrl}/customer-profile?payment=failed`);
        }
    } catch (error) {
        console.error("PayOS Return Error:", error);
        res.redirect(`${clientUrl}/customer-profile?payment=error`);
    }
});

export const payosCancel = asyncHandler(async (req: Request, res: Response) => {
    const clientUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${clientUrl}/cart?payment=cancelled`);
});
