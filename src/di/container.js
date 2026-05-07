const { createContainer, asClass, asValue, asFunction } = require('awilix');

// Models
const User = require('../infrastructure/database/models/user.model');
const Tenant = require('../infrastructure/database/models/tenant.model');
const Product = require('../infrastructure/database/models/product.model');

// Security
const BcryptHasher = require('../infrastructure/security/BcryptHasher');
const TokenManager = require('../infrastructure/security/TokenManager');

// Repositories
const UserRepository = require('../infrastructure/repositories/UserRepository');
const ProductRepository = require('../infrastructure/repositories/ProductRepository');
const TenantRepository = require('../infrastructure/repositories/TenantRepository');

// Use Cases
const AdminRegisterUseCase = require('../application/use-cases/auth/AdminRegisterUseCase');
const AdminLoginUseCase = require('../application/use-cases/auth/AdminLoginUseCase');
const UserUseCases = require('../application/use-cases/user/UserUseCases');
const ProductUseCases = require('../application/use-cases/product/ProductUseCases');
const TenantUseCases = require('../application/use-cases/tenant/TenantUseCases');

const container = createContainer();

// Bind dependencies
container.register({
    // Models
    userModel: asValue(User),
    tenantModel: asValue(Tenant),
    productModel: asValue(Product),

    // Infrastructure
    hasher: asClass(BcryptHasher).singleton(),
    tokenManager: asClass(TokenManager).singleton(),
    userRepository: asClass(UserRepository).singleton(),
    productRepository: asClass(ProductRepository).singleton(),
    tenantRepository: asClass(TenantRepository).singleton(),

    // Use Cases
    adminRegisterUseCase: asClass(AdminRegisterUseCase).singleton(),
    adminLoginUseCase: asClass(AdminLoginUseCase).singleton(),
    userUseCases: asClass(UserUseCases).singleton(),
    productUseCases: asClass(ProductUseCases).singleton(),
    tenantUseCases: asClass(TenantUseCases).singleton(),
});

module.exports = container;
