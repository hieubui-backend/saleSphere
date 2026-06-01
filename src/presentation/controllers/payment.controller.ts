import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';

export const vnpayReturn = asyncHandler(async (req: Request, res: Response) => {
    const { paymentUseCases } = req.container.cradle;
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';

    const orderId = await paymentUseCases.handleVnPayReturn(req.query);

    if (orderId) {
        res.redirect(`${clientUrl}/payment/success?orderId=${orderId}`);
    } else {
        res.redirect(`${clientUrl}/payment/failed`);
    }
});

export const vnpayIpn = asyncHandler(async (req: Request, res: Response) => {
    const { paymentUseCases } = req.container.cradle;
    const result = await paymentUseCases.handleVnPayIpn(req.query);
    res.status(200).json(result);
});

export const payosWebhook = asyncHandler(async (req: Request, res: Response) => {
    const { paymentUseCases } = req.container.cradle;
    
    try {
        const io = req.app.get('socketio');
        const order = await paymentUseCases.handlePayOSWebhook(req.body, io);
        
        if (order) {
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
    const clientUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
    const { paymentUseCases } = req.container.cradle;

    try {
        const io = req.app.get('socketio');
        const isSuccess = await paymentUseCases.handlePayOSReturn(req.query, io);
        
        if (isSuccess) {
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
