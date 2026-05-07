const express = require('express');
const router = express.Router();
const Order = require('./order.model');
const Product = require('../product/product.model');

/**
 * POST /api/webhook/logistics
 * Endpoint giả lập nhận dữ liệu từ đơn vị vận chuyển
 */
router.post('/logistics', async (req, res) => {
    try {
        const { order_id, status, partner, tracking_number } = req.body;

        console.log(`[Logistics Webhook] Nhận tin từ: ${partner || 'N/A'} | Đơn: ${order_id} | Trạng thái: ${status}`);

        // 1. Kiểm tra đơn hàng
        const order = await Order.findById(order_id);
        if (!order) {
            return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng trên hệ thống" });
        }

        // 2. Phân loại trạng thái hệ thống
        let newStatus = order.status; 
        let shouldRestock = false;

        // Chuẩn hóa status về chữ in hoa để tránh lỗi so khớp
        const partnerStatus = status.toUpperCase();

        switch (partnerStatus) {
            case 'DELIVERING': 
                newStatus = 'shipping'; 
                break;
            case 'DELIVERED': 
                newStatus = 'completed'; 
                break;
            case 'FAILED': // Giao hàng không thành công
                newStatus = 'failed';
                shouldRestock = true;
                break;
            case 'RETURNED': // Khách trả hàng / Chuyển hoàn
                newStatus = 'returned'; 
                shouldRestock = true; 
                break;
            case 'CANCELLED': // Hủy đơn từ phía vận chuyển
                newStatus = 'cancelled'; 
                shouldRestock = true; 
                break;
            default:
                // Nếu trạng thái lạ, giữ nguyên status cũ
                break;
        }

        // 3. LOGIC HOÀN KHO (RESTOCK)
        // Điều kiện: Trạng thái mới là lỗi/trả/hủy VÀ trạng thái cũ chưa được hoàn kho
        const errorStatuses = ['cancelled', 'failed', 'returned'];
        const isTransitioningToError = errorStatuses.includes(newStatus);
        const wasAlreadyError = errorStatuses.includes(order.status);

        if (shouldRestock && isTransitioningToError && !wasAlreadyError) {
            console.log(`[Inventory] Đơn hàng lỗi. Đang hoàn lại hàng vào kho...`);
            
            if (order.items && order.items.length > 0) {
                const restockPromises = order.items.map(item => {
                    return Product.findByIdAndUpdate(item.productId, {
                        $inc: { stock: item.quantity } // Cộng lại số lượng
                    });
                });
                await Promise.all(restockPromises);
                console.log(`[Inventory] Hoàn kho thành công cho đơn: ${order_id}`);
            }
        }

        // 4. Cập nhật thông tin vận đơn vào Database
        order.status = newStatus;
        if (partner) order.shippingPartner = partner;
        if (tracking_number) order.trackingNumber = tracking_number;
        order.updatedBy = `Webhook: ${partner || 'Logistics Partner'}`;

        await order.save();

        // 5. PHÁT TÍN HIỆU REAL-TIME
        const io = req.app.get('socketio');
        if (io) {
            const shortId = order._id.toString().substring(18).toUpperCase();
            
            // Cập nhật bảng danh sách
            io.emit('orderUpdate', {
                orderId: shortId,
                fullId: order._id,
                status: newStatus,
                tenantId: order.tenantId
            });

            // Cập nhật các con số Dashboard (Stats)
            io.emit('statsUpdate', { 
                tenantId: order.tenantId,
                message: `Đơn #${shortId} chuyển sang: ${newStatus}`
            });
        }

        // 6. Trả lời đối tác (Phải trả về 200 để họ không gửi lại nữa)
        res.status(200).json({ 
            success: true, 
            message: "Hệ thống đã ghi nhận trạng thái mới",
            updatedStatus: newStatus,
            stockRestocked: (shouldRestock && isTransitioningToError && !wasAlreadyError)
        });

    } catch (error) {
        console.error("Webhook Internal Error:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;