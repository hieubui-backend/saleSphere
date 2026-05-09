import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';

export const getCart = asyncHandler(async (req: Request, res: Response) => {
    const customerId = req.session.customer?._id || (req as any).user?._id;
    if (!customerId) {
        res.status(401).json({ success: false, message: 'Vui long dang nhap' });
        return;
    }

    const { cartRepository } = req.container.cradle;
    const cart = await cartRepository.findByCustomerId(customerId);

    res.status(200).json({ success: true, data: cart || { items: [], totalAmount: 0 } });
});

export const addToCart = asyncHandler(async (req: Request, res: Response) => {
    const customerId = req.session.customer?._id || (req as any).user?._id;
    if (!customerId) {
        res.status(401).json({ success: false, message: 'Vui lòng đăng nhập' });
        return;
    }

    const { productId, quantity } = req.body;
    const { cartUseCases } = req.container.cradle;
    
    await cartUseCases.addToCart(customerId, { productId, quantity: Number(quantity) || 1 });

    res.json({ success: true, message: 'Đã thêm sản phẩm vào giỏ hàng' });
});

export const updateCartQuantity = async (req: Request, res: Response) => {
    try {
        const { productId, change } = req.body; 
        const customerId = req.session.customer?._id || req.user?._id;

        if (!customerId) {
            return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập' });
        }

        const { cartUseCases } = req.container.cradle;
        const cart = await cartUseCases.updateCartQuantity(customerId, productId as string, change);

        return res.json({ 
            success: true, 
            message: 'Cập nhật thành công',
            cart: cart 
        });
    } catch (error: any) {
        console.error("CartEntity Update Error:", error);
        res.status(error.message.includes('không tồn tại') || error.message.includes('không có') ? 404 : 400).json({ success: false, message: error.message });
    }
};

export const checkout = async (req: Request, res: Response) => {
    try {
        const customerId = req.session.customer?._id || req.user?._id;
        
        if (!customerId) {
            return res.status(401).json({ success: false, message: 'Phiên làm việc hết hạn' });
        }

        const { paymentMethod, shippingAddress, region } = req.body;
        
        const { cartUseCases, vnPayGateway } = req.container.cradle;
        const order = await cartUseCases.checkout(customerId, {
            paymentMethod,
            shippingAddress,
            region
        });

        let paymentUrl: string | null = null;
        if (paymentMethod === 'vnpay') {
            const ipAddr = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
            const returnUrl = process.env.VNPAY_RETURN_URL || 'http://localhost:5000/api/payment/vnpay/return';
            paymentUrl = vnPayGateway.createPaymentUrl((order as any).id || (order as any)._id, (order as any).totalAmount, ipAddr, returnUrl);
        }

        res.json({ 
            success: true, 
            message: 'Đặt hàng thành công!',
            orderId: (order as any).id || (order as any)._id,
            paymentUrl
        });
    } catch (error: any) {
        console.error("Checkout Error:", error);
        res.status(400).json({ success: false, message: error.message });
    }
};





