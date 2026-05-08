const asyncHandler = require('express-async-handler');

// Return URL (Redirect khách hàng sau khi thanh toán xong)
exports.vnpayReturn = asyncHandler(async (req, res) => {
    const { vnPayGateway, orderUseCases } = req.container.cradle;
    const isVerified = vnPayGateway.verifyReturn(req.query);

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';

    if (isVerified.isSuccess) {
        const orderId = req.query.vnp_TxnRef;
        await orderUseCases.updatePaymentStatus(orderId, 'paid');
        res.redirect(`${clientUrl}/payment/success?orderId=${orderId}`);
    } else {
        res.redirect(`${clientUrl}/payment/failed`);
    }
});

// IPN URL (Server-to-Server update)
exports.vnpayIpn = asyncHandler(async (req, res) => {
    const { vnPayGateway, orderUseCases } = req.container.cradle;
    
    try {
        const isVerified = vnPayGateway.verifyIpn(req.query);

        if (isVerified.isSuccess) {
            const orderId = req.query.vnp_TxnRef;
            await orderUseCases.updatePaymentStatus(orderId, 'paid');
            return res.status(200).json({ RspCode: '00', Message: 'Confirm Success' });
        } else {
            return res.status(200).json({ RspCode: '97', Message: 'Checksum failed' });
        }
    } catch (error) {
        return res.status(200).json({ RspCode: '99', Message: 'Unknown error' });
    }
});
