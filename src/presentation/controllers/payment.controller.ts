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





