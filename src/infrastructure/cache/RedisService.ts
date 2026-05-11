import Redis from 'ioredis';
import config from '../../config/config';

export default class RedisService {
    private client: Redis;

    constructor() {
        this.client = new Redis(config.redisUrl, {
            retryStrategy: (times) => Math.min(times * 50, 2000),
            maxRetriesPerRequest: 3
        });

        this.client.on('error', (err) => {
            console.error('Redis Client Error:', err);
        });

        this.client.on('connect', () => {
            console.log('✅ Kết nối Redis thành công!');
        });
    }

    public async get(key: string): Promise<string | null> {
        try {
            return await this.client.get(key);
        } catch (error) {
            console.error(`[Redis Fail-safe] Get Error for key ${key}:`, error);
            return null; // Trả về null để app lấy từ DB
        }
    }

    /**
     * Set giá trị vào Redis với TTL ngẫu nhiên (chống Cache Avalanche)
     * @param key 
     * @param value 
     * @param baseTTL Giây
     */
    public async setWithRandomTTL(key: string, value: string, baseTTL: number = 3600): Promise<void> {
        try {
            // Cộng thêm từ 5-10% thời gian ngẫu nhiên
            const randomOffset = Math.floor(Math.random() * (baseTTL * 0.1));
            const finalTTL = baseTTL + randomOffset;
            
            await this.client.set(key, value, 'EX', finalTTL);
        } catch (error) {
            console.error(`[Redis Fail-safe] Set Error for key ${key}:`, error);
        }
    }

    public async del(keys: string | string[]): Promise<void> {
        try {
            if (Array.isArray(keys)) {
                if (keys.length > 0) await this.client.del(...keys);
            } else {
                await this.client.del(keys);
            }
        } catch (error) {
            console.error(`[Redis Fail-safe] Del Error:`, error);
        }
    }

    public async clearPattern(pattern: string): Promise<void> {
        try {
            const keys = await this.client.keys(pattern);
            if (keys.length > 0) {
                await this.client.del(...keys);
            }
        } catch (error) {
            console.error(`[Redis Fail-safe] ClearPattern Error:`, error);
        }
    }
}
