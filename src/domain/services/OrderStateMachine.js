const OrderStatusEnum = require('../enums/OrderStatusEnum');

class OrderStateMachine {
    /**
     * Định nghĩa các trạng thái có thể chuyển đến từ một trạng thái hiện tại.
     * Dùng để đảm bảo tính toàn vẹn dữ liệu.
     */
    static VALID_TRANSITIONS = {
        [OrderStatusEnum.PENDING]:    [OrderStatusEnum.PROCESSING, OrderStatusEnum.CANCELLED],
        [OrderStatusEnum.PROCESSING]: [OrderStatusEnum.SHIPPING, OrderStatusEnum.CANCELLED],
        [OrderStatusEnum.SHIPPING]:   [OrderStatusEnum.COMPLETED, OrderStatusEnum.FAILED],
        [OrderStatusEnum.COMPLETED]:  [OrderStatusEnum.DISPUTE_ESCALATED], // Có thể mở khiếu nại sau khi giao
        [OrderStatusEnum.FAILED]:     [OrderStatusEnum.RETURNED, OrderStatusEnum.DISPUTE_ESCALATED],
        [OrderStatusEnum.DISPUTE_ESCALATED]: [OrderStatusEnum.RETURNED, OrderStatusEnum.COMPLETED],
        [OrderStatusEnum.CANCELLED]:  [], // Terminal state
        [OrderStatusEnum.RETURNED]:   []  // Terminal state
    };

    /**
     * Kiểm tra việc chuyển trạng thái có hợp lệ không
     * @param {string} currentState Trạng thái hiện tại
     * @param {string} nextState Trạng thái mong muốn
     * @returns {boolean} True nếu hợp lệ
     */
    static canTransition(currentState, nextState) {
        if (!this.VALID_TRANSITIONS[currentState]) {
            return false;
        }
        return this.VALID_TRANSITIONS[currentState].includes(nextState);
    }

    /**
     * Thực hiện chuyển trạng thái (chỉ trả về true/false hoặc throw error)
     * @param {string} currentState 
     * @param {string} nextState 
     * @throws {Error} Nếu transition không hợp lệ
     */
    static validateTransition(currentState, nextState) {
        if (!this.canTransition(currentState, nextState)) {
            throw new Error(`Không thể chuyển trạng thái đơn hàng từ '${currentState}' sang '${nextState}'`);
        }
        return true;
    }
}

module.exports = OrderStateMachine;
