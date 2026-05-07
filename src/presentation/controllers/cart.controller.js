exports.updateCartQuantity = async (req, res) => {
    try {
        const { productId, change } = req.body; 
        const customerId = req.session.customer?._id || req.user?._id;

        if (!customerId) {
            return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập' });
        }

        const { cartUseCases } = req.container.cradle;
        const cart = await cartUseCases.updateCartQuantity(customerId, productId, change);

        return res.json({ 
            success: true, 
            message: 'Cập nhật thành công',
            cart: cart 
        });
    } catch (error) {
        console.error("Cart Update Error:", error);
        res.status(error.message.includes('không tồn tại') || error.message.includes('không có') ? 404 : 400).json({ success: false, message: error.message });
    }
};

exports.checkout = async (req, res) => {
    try {
        const customerId = req.session.customer?._id || req.user?._id;
        const tenantId = req.session.customer?.tenantId || req.user?.tenantId;
        
        if (!customerId) {
            return res.status(401).json({ success: false, message: 'Phiên làm việc hết hạn' });
        }

        const { cartUseCases } = req.container.cradle;
        const order = await cartUseCases.checkout(customerId, tenantId);

        res.json({ 
            success: true, 
            message: 'Đặt hàng thành công!',
            orderId: order._id 
        });
    } catch (error) {
        console.error("Checkout Error:", error);
        res.status(400).json({ success: false, message: error.message });
    }
};
