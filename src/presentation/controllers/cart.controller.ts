import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';

// Hàm hỗ trợ lấy ID (từ Token hoặc Header x-guest-id)
const getCustomerIdOrGuest = (req: Request): string | null => {
    return req.session.customer?.id || req.session.customer?._id || 
           (req as any).user?.id || (req as any).user?._id || 
           (req.headers['x-guest-id'] as string) || null;
};

// Hàm hỗ trợ gắn base URL cho ảnh trong giỏ hàng
const formatCartImages = (cart: any) => {
    if (!cart || !cart.items) return cart;
    const baseUrl = process.env.SERVER_URL || 'http://localhost:5000';
    const formattedCart = JSON.parse(JSON.stringify(cart)); // Loại bỏ các properties thừa của Mongoose
    
    formattedCart.items = formattedCart.items.map((item: any) => {
        if (item.product && item.product.images) {
            item.product.images = item.product.images.map((img: string) => img.startsWith('http') ? img : `${baseUrl}${img}`);
        }
        if (item.image && typeof item.image === 'string' && !item.image.startsWith('http')) {
            item.image = `${baseUrl}${item.image}`;
        }
        return item;
    });
    return formattedCart;
};

export const getCart = asyncHandler(async (req: Request, res: Response) => {
    const customerId = getCustomerIdOrGuest(req);

    if (!customerId) {
        // Trả về giỏ hàng rỗng nếu không có định danh
        res.status(200).json({ success: true, data: { items: [], totalAmount: 0 }, cart: { items: [], totalAmount: 0 } });
        return;
    }

    const { cartRepository } = req.container.cradle;
    const cart = await cartRepository.findByCustomerId(customerId);

    const formattedCart = formatCartImages(cart);

    res.status(200).json({ 
        success: true, 
        data: formattedCart || { items: [], totalAmount: 0 },
        cart: formattedCart || { items: [], totalAmount: 0 }
    });
});

export const addToCart = asyncHandler(async (req: Request, res: Response) => {
    let customerId = getCustomerIdOrGuest(req);
    let isGuest = false;

    if (!customerId) {
        // Sinh ID ngẫu nhiên định dạng ObjectId cho Guest
        customerId = new mongoose.Types.ObjectId().toString();
        isGuest = true;
    }

    const { productId, quantity } = req.body;
    const { cartUseCases } = req.container.cradle;
    
    await cartUseCases.addToCart(customerId, { productId, quantity: Number(quantity) || 1 });

    res.json({ 
        success: true, 
        message: 'Đã thêm sản phẩm vào giỏ hàng',
        guestId: isGuest ? customerId : undefined 
    });
});

export const updateCartQuantity = asyncHandler(async (req: Request, res: Response) => {
    try {
        const { productId, change, quantity } = req.body; 
        const customerId = getCustomerIdOrGuest(req);

        if (!customerId) {
            res.status(400).json({ success: false, message: 'Không tìm thấy thông tin giỏ hàng' });
            return;
        }

        const finalChange = change !== undefined ? change : quantity;

        const { cartUseCases } = req.container.cradle;
        const cart = await cartUseCases.updateCartQuantity(customerId, productId as string, finalChange);

        res.json({ 
            success: true, 
            message: 'Cập nhật thành công',
            cart: formatCartImages(cart) 
        });
    } catch (error: any) {
        console.error("CartEntity Update Error:", error);
        res.status(error.message.includes('không tồn tại') || error.message.includes('không có') ? 404 : 400).json({ success: false, message: error.message });
    }
});

export const removeFromCart = asyncHandler(async (req: Request, res: Response) => {
    try {
        const customerId = getCustomerIdOrGuest(req);
        const { productId } = req.params;

        if (!customerId) {
            res.status(400).json({ success: false, message: 'Không tìm thấy thông tin giỏ hàng' });
            return;
        }

        const { cartUseCases } = req.container.cradle;
        const cart = await cartUseCases.removeFromCart(customerId, productId as string);

        res.json({ 
            success: true, 
            message: 'Đã xóa sản phẩm khỏi giỏ hàng',
            cart: formatCartImages(cart) 
        });
    } catch (error: any) {
        console.error("Cart Remove Error:", error);
        res.status(400).json({ success: false, message: error.message });
    }
});

export const checkout = asyncHandler(async (req: Request, res: Response) => {
    try {
        const customerId = getCustomerIdOrGuest(req);
        
        if (!customerId) {
            res.status(401).json({ success: false, message: 'Không tìm thấy giỏ hàng để thanh toán' });
            return;
        }

        const { paymentMethod, shippingAddress, region } = req.body;
        
        const { cartRepository, orderUseCases, vnPayGateway, payOSGateway, orderRepository } = req.container.cradle;
        
        // 1. Lấy giỏ hàng từ CSDL
        const cart = await cartRepository.findByCustomerId(customerId);
        if (!cart || !cart.items || cart.items.length === 0) {
            res.status(400).json({ success: false, message: 'Giỏ hàng trống' });
            return;
        }

        // 2. Chuyển items sang OrderUseCases (Đảm bảo tính lại tiền từ Product DB)
        const items = cart.items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity
        }));

        const order = await orderUseCases.createOrder(customerId, { paymentMethod, shippingAddress, region, items });
        if (!order) {
            throw new Error('Không thể tạo đơn hàng');
        }
        
        // 3. Xóa giỏ hàng sau khi tạo đơn thành công
        cart.items = [];
        await cartRepository.save(cart);

        // 4. Tạo phiên thanh toán (VNPay hoặc PayOS)
        let paymentUrl: string | null = null;
        const { paymentUseCases } = req.container.cradle;
        const ipAddr = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
        paymentUrl = await paymentUseCases.createPaymentSession(order, ipAddr);

        // Thông báo qua Socket.io để Admin Dashboard nhận được đơn mới
        const io = req.app.get('socketio');
        if (io) {
            io.emit('orderUpdate', { orderId: order.id, status: 'pending' });
        }

        res.json({ 
            success: true, 
            message: 'Đặt hàng thành công!',
            orderId: order.id,
            paymentUrl
        });
    } catch (error: any) {
        console.error("Checkout Error:", error);
        res.status(400).json({ success: false, message: error.message });
    }
});
