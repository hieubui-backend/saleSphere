import { createContainer, asClass, asValue, InjectionMode } from 'awilix';

// Models
import UserEntity from '../infrastructure/database/models/user.model';
import ProductEntity from '../infrastructure/database/models/product.model';
import OrderEntity from '../infrastructure/database/models/order.model';
import CartEntity from '../infrastructure/database/models/cart.model';
import CustomerEntity from '../infrastructure/database/models/customer.model';

// Security
import BcryptHasher from '../infrastructure/security/BcryptHasher';
import TokenManager from '../infrastructure/security/TokenManager';

// Payment
import VNPayGateway from '../infrastructure/payment/VNPayGateway';
import PayOSGateway from '../infrastructure/payment/PayOSGateway';

// Repositories
import UserRepository from '../infrastructure/repositories/UserRepository';
import ProductRepository from '../infrastructure/repositories/ProductRepository';
import CartRepository from '../infrastructure/repositories/CartRepository';
import CustomerRepository from '../infrastructure/repositories/CustomerRepository';
import OrderRepository from '../infrastructure/repositories/OrderRepository';

// Use Cases
import AdminRegisterUseCase from '../application/use-cases/auth/AdminRegisterUseCase';
import AdminLoginUseCase from '../application/use-cases/auth/AdminLoginUseCase';
import CustomerRegisterUseCase from '../application/use-cases/auth/CustomerRegisterUseCase';
import CustomerLoginUseCase from '../application/use-cases/auth/CustomerLoginUseCase';
import UserUseCases from '../application/use-cases/user/UserUseCases';
import ProductUseCases from '../application/use-cases/product/ProductUseCases';
import OrderUseCases from '../application/use-cases/order/OrderUseCases';
import CartUseCases from '../application/use-cases/cart/CartUseCases';
import CustomerUseCases from '../application/use-cases/customer/CustomerUseCases';
import PaymentUseCases from '../application/use-cases/payment/PaymentUseCases';

const container = createContainer({
  injectionMode: InjectionMode.PROXY
});

// Bind dependencies
container.register({
  // Models
  userModel: asValue(UserEntity),
  productModel: asValue(ProductEntity),
  orderModel: asValue(OrderEntity),
  cartModel: asValue(CartEntity),
  customerModel: asValue(CustomerEntity),

  // Infrastructure
  hasher: asClass(BcryptHasher).singleton(),
  tokenManager: asClass(TokenManager).singleton(),
  vnPayGateway: asClass(VNPayGateway).singleton(),
  payOSGateway: asClass(PayOSGateway).singleton(),
  userRepository: asClass(UserRepository).singleton(),
  productRepository: asClass(ProductRepository).singleton(),
  cartRepository: asClass(CartRepository).singleton(),
  customerRepository: asClass(CustomerRepository).singleton(),
  orderRepository: asClass(OrderRepository).singleton(),

  // Use Cases
  adminRegisterUseCase: asClass(AdminRegisterUseCase).singleton(),
  adminLoginUseCase: asClass(AdminLoginUseCase).singleton(),
  customerRegisterUseCase: asClass(CustomerRegisterUseCase).singleton(),
  customerLoginUseCase: asClass(CustomerLoginUseCase).singleton(),
  userUseCases: asClass(UserUseCases).singleton(),
  productUseCases: asClass(ProductUseCases).singleton(),
  orderUseCases: asClass(OrderUseCases).singleton(),
  cartUseCases: asClass(CartUseCases).singleton(),
  customerUseCases: asClass(CustomerUseCases).singleton(),
  paymentUseCases: asClass(PaymentUseCases).singleton(),
});

export default container;