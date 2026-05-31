import { Worker, Job } from 'bullmq';
import config from '../../../config/config';
import EmailService from '../../services/EmailService';
import { EMAIL_QUEUE_NAME, EmailJobType } from '../EmailQueue';
import logger from '../../logging/logger';

export default class EmailWorker {
    private worker: Worker;
    private emailService: EmailService;

    constructor({ emailService }: { emailService: EmailService }) {
        this.emailService = emailService;

        this.worker = new Worker(
            EMAIL_QUEUE_NAME,
            async (job: Job) => {
                await this.processJob(job);
            },
            {
                connection: {
                    url: config.redisUrl
                },
                concurrency: 5 // Process up to 5 emails in parallel
            }
        );

        this.setupEvents();
    }

    private async processJob(job: Job): Promise<void> {
        const { name, data } = job;
        
        logger.info(`[EmailWorker] Processing job ${job.id} of type ${name}`);

        switch (name) {
            case EmailJobType.ORDER_CONFIRMATION:
                await this.emailService.sendOrderConfirmation(data.email, data.orderData);
                break;
            case EmailJobType.WELCOME_EMAIL:
                await this.emailService.sendWelcomeEmail(data.email, data.name);
                break;
            default:
                logger.warn(`[EmailWorker] Unknown job type: ${name}`);
        }
    }

    private setupEvents(): void {
        this.worker.on('completed', (job) => {
            logger.info(`[EmailWorker] Job ${job.id} completed successfully`);
        });

        this.worker.on('failed', (job, err) => {
            logger.error(`[EmailWorker] Job ${job?.id} failed with error: ${err.message}`);
        });

        this.worker.on('error', (err) => {
            logger.error(`[EmailWorker] Worker error: ${err.message}`);
        });
    }

    public async close(): Promise<void> {
        await this.worker.close();
    }
}
