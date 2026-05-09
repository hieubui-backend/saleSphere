import { OrderStatus } from '../enums/OrderStatusEnum';

export default class OrderStateMachine {
    /**
     * Định nghĩa các trạng thái có thể chuyển đến từ một trạng thái hiện tại.
     * Dùng để đảm bảo tính toàn vẹn dữ liệu.
     */
    private static readonly VALID_TRANSITIONS: Record<string, string[]> = {
        [OrderStatus.PENDING]:    [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
        [OrderStatus.PROCESSING]: [OrderStatus.SHIPPING, OrderStatus.CANCELLED],
        [OrderStatus.SHIPPING]:   [OrderStatus.COMPLETED, OrderStatus.FAILED],
        [OrderStatus.COMPLETED]:  [OrderStatus.DISPUTE_ESCALATED],
        [OrderStatus.FAILED]:     [OrderStatus.RETURNED, OrderStatus.DISPUTE_ESCALATED],
        [OrderStatus.DISPUTE_ESCALATED]: [OrderStatus.RETURNED, OrderStatus.COMPLETED],
        [OrderStatus.CANCELLED]:  [],
        [OrderStatus.RETURNED]:   []
    };

    /**
     * Kiểm tra việc chuyển trạng thái có hợp lệ không
     * @param currentState Trạng thái hiện tại
     * @param nextState Trạng thái mong muốn
     * @returns True nếu hợp lệ
     */
    public static canTransition(currentState: string, nextState: string): boolean {
        if (!this.VALID_TRANSITIONS[currentState]) {
            return false;
        }
        return this.VALID_TRANSITIONS[currentState].includes(nextState);
    }

    /**
     * Thực hiện chuyển trạng thái
     * @param currentState 
     * @param nextState 
     * @throws Error Nếu transition không hợp lệ
     */
    public static validateTransition(currentState: string, nextState: string): boolean {
        if (!this.canTransition(currentState, nextState)) {
            throw new Error(`Không thể chuyển trạng thái đơn hàng từ '${currentState}' sang '${nextState}'`);
        }
        return true;
    }
}





