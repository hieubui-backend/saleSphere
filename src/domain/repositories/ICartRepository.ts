import { CartEntity } from '../entities/CartEntity';

export interface ICartRepository {
    findByCustomerId(customerId: string): Promise<CartEntity | null>;
    save(cartEntity: CartEntity): Promise<CartEntity | null>;
    deleteByCustomerId(customerId: string): Promise<void>;
}
