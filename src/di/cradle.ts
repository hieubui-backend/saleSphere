import { Model } from 'mongoose';
import { IUser } from '../infrastructure/database/models/user.model';
import { IProduct } from '../infrastructure/database/models/product.model';
import { IOrder } from '../infrastructure/database/models/order.model';
import { ICart } from '../infrastructure/database/models/cart.model';
import { ICustomer } from '../infrastructure/database/models/customer.model';
import BcryptHasher from '../infrastructure/security/BcryptHasher';
import TokenManager from '../infrastructure/security/TokenManager';
import VNPayGateway from '../infrastructure/payment/VNPayGateway';
import UserRepository from '../infrastructure/repositories/UserRepository';
import ProductRepository from '../infrastructure/repositories/ProductRepository';
import CartRepository from '../infrastructure/repositories/CartRepository';
import CustomerRepository from '../infrastructure/repositories/CustomerRepository';
import OrderRepository from '../infrastructure/repositories/OrderRepository';
import CustomerRegisterUseCase from '../application/use-cases/auth/CustomerRegisterUseCase';
import CustomerLoginUseCase from '../application/use-cases/auth/CustomerLoginUseCase';
import AdminRegisterUseCase from '../application/use-cases/auth/AdminRegisterUseCase';
import AdminLoginUseCase from '../application/use-cases/auth/AdminLoginUseCase';
import UserUseCases from '../application/use-cases/user/UserUseCases';
import ProductUseCases from '../application/use-cases/product/ProductUseCases';
import OrderUseCases from '../application/use-cases/order/OrderUseCases';
import CartUseCases from '../application/use-cases/cart/CartUseCases';
import CustomerUseCases from '../application/use-cases/customer/CustomerUseCases';

export interface ICradle {
    // Models
    userModel: Model<IUser>;
    productModel: Model<IProduct>;
    orderModel: Model<IOrder>;
    cartModel: Model<ICart>;
    customerModel: Model<ICustomer>;

    // Infrastructure
    hasher: BcryptHasher;
    tokenManager: TokenManager;
    vnPayGateway: VNPayGateway;
    userRepository: UserRepository;
    productRepository: ProductRepository;
    cartRepository: CartRepository;
    customerRepository: CustomerRepository;
    orderRepository: OrderRepository;

    // Use Cases
    adminRegisterUseCase: AdminRegisterUseCase;
    adminLoginUseCase: AdminLoginUseCase;
    customerRegisterUseCase: CustomerRegisterUseCase;
    customerLoginUseCase: CustomerLoginUseCase;
    userUseCases: UserUseCases;
    productUseCases: ProductUseCases;
    orderUseCases: OrderUseCases;
    cartUseCases: CartUseCases;
    customerUseCases: CustomerUseCases;
}





