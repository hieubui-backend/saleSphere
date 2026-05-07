const Cart = require('../modules/cart/cart.model'); // Đảm bảo đường dẫn đúng tới model của bạn
const Product = require('../infrastructure/database/models/product.model');
const orderService = require('../services/order.service');

// ==========================================
// 1. CẬP NHẬT SỐ LƯỢNG (TĂNG/GIẢM)
// ==========================================
exports.updateCartQuantity = async (req, res) => {
    try {
        const { productId, change } = req.body; // change nhận giá trị 1 hoặc -1
        const customerId = req.session.customer?._id || req.user?._id;

        if (!customerId) {
            return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập' });
        }

        // Tìm giỏ hàng và populate sản phẩm để lấy giá & tồn kho
        const cart = await Cart.findOne({ customerId }).populate('items.productId');
        if (!cart) {
            return res.status(404).json({ success: false, message: 'Giỏ hàng không tồn tại' });
        }

        const itemIndex = cart.items.findIndex(p => p.productId._id.toString() === productId);

        if (itemIndex > -1) {
            const product = cart.items[itemIndex].productId;
            const currentQty = cart.items[itemIndex].quantity;
            const newQty = currentQty + change;

            // KIỂM TRA 1: Nếu tăng (+) - Check tồn kho
            if (change > 0 && newQty > product.stock) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Sản phẩm này chỉ còn ${product.stock} món trong kho` 
                });
            }

            // KIỂM TRA 2: Nếu giảm xuống 0 hoặc ít hơn -> Xóa khỏi giỏ
            if (newQty <= 0) {
                cart.items.splice(itemIndex, 1);
            } else {
                cart.items[itemIndex].quantity = newQty;
            }

            // TÍNH TOÁN LẠI TỔNG TIỀN GIỎ HÀNG
            // (Giả sử model của bạn có trường totalPrice)
            cart.totalPrice = cart.items.reduce((total, item) => {
                return total + (item.quantity * item.productId.price);
            }, 0);

            await cart.save();
            return res.json({ 
                success: true, 
                message: 'Cập nhật thành công',
                cart: cart 
            });
        }

        res.status(400).json({ success: false, message: 'Sản phẩm không có trong giỏ' });
    } catch (error) {
        console.error("Cart Update Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==========================================
// 2. THANH TOÁN (CHECKOUT)
// ==========================================
exports.checkout = async (req, res) => {
    try {
        const customerId = req.session.customer?._id || req.user?._id;
        const tenantId = req.session.customer?.tenantId || req.user?.tenantId;
        
        if (!customerId) {
            return res.status(401).json({ success: false, message: 'Phiên làm việc hết hạn' });
        }

        // Kiểm tra giỏ hàng có đồ không trước khi tạo đơn
        const cart = await Cart.findOne({ customerId });
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ success: false, message: 'Giỏ hàng trống, không thể thanh toán' });
        }

        // Gọi Order Service để tạo đơn hàng từ giỏ hàng
        const order = await orderService.createFromCart(customerId, tenantId);
        
        // Sau khi tạo đơn thành công thì xóa giỏ hàng
        await Cart.deleteOne({ customerId });

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