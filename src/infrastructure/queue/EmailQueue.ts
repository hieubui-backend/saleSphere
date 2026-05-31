import { Queue } from 'bullmq';
import config from '../../config/config';
import OrderEntity from '../../domain/entities/OrderEntity';

export const EMAIL_QUEUE_NAME = 'email-queue';

export enum EmailJobType {
    ORDER_CONFIRMATION = 'ORDER_CONFIRMATION',
    WELCOME_EMAIL = 'WELCOME_EMAIL'
}

export default class EmailQueue {
    private queue: Queue;

    constructor() {
        // BullMQ uses ioredis connection
        this.queue = new Queue(EMAIL_QUEUE_NAME, {
            connection: {
                url: config.redisUrl
            },
            defaultJobOptions: {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 5000, // 5s, 10s, 20s...
                },
                removeOnComplete: true, // Clean up successful jobs
                removeOnFail: {
                    age: 24 * 3600 // Keep failed jobs for 24 hours for debugging
                }
            }
        });
    }

    /**
     * Add order confirmation job to queue
     */
    public async addOrderConfirmationJob(email: string, order: OrderEntity): Promise<void> {
        await this.queue.add(EmailJobType.ORDER_CONFIRMATION, {
            email,
            orderData: {
                id: order.id,
                orderCode: order.orderCode,
                totalAmount: order.totalAmount,
                items: order.items,
                paymentMethod: order.paymentMethod
            }
        });
    }

    /**
     * Add welcome email job to queue
     */
    public async addWelcomeEmailJob(email: string, name: string): Promise<void> {
        await this.queue.add(EmailJobType.WELCOME_EMAIL, {
            email,
            name
        });
    }

    /**
     * Close the queue connection
     */
    public async close(): Promise<void> {
        await this.queue.close();
    }
}
