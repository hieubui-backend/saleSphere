class OrderStatusEnum {
    static PENDING = 'pending';                     // Chờ xác nhận
    static PROCESSING = 'processing';               // Đang chuẩn bị hàng
    static SHIPPING = 'shipping';                   // Đang giao
    static COMPLETED = 'completed';                 // Thành công
    static CANCELLED = 'cancelled';                 // Hủy đơn
    static FAILED = 'failed';                       // Giao lỗi
    static RETURNED = 'returned';                   // Đã hoàn trả xong
    static DISPUTE_ESCALATED = 'dispute_escalated'; // Đang xử lý tranh chấp

    static getAll() {
        return [
            this.PENDING, this.PROCESSING, this.SHIPPING, 
            this.COMPLETED, this.CANCELLED, this.FAILED, 
            this.RETURNED, this.DISPUTE_ESCALATED
        ];
    }
}

module.exports = OrderStatusEnum;
