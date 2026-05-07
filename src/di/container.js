const { createContainer, asClass, asValue, asFunction } = require('awilix');

// Models
const User = require('../infrastructure/database/models/user.model');
const Tenant = require('../modules/tenant/tenant.model'); // Tạm thời dùng model cũ, sẽ refactor sau

// Security
const BcryptHasher = require('../infrastructure/security/BcryptHasher');
const TokenManager = require('../infrastructure/security/TokenManager');

// Repositories
const UserRepository = require('../infrastructure/repositories/UserRepository');

// Use Cases
const AdminRegisterUseCase = require('../application/use-cases/auth/AdminRegisterUseCase');
const AdminLoginUseCase = require('../application/use-cases/auth/AdminLoginUseCase');
const UserUseCases = require('../application/use-cases/user/UserUseCases');

const container = createContainer();

// Bind dependencies
container.register({
    // Models
    userModel: asValue(User),
    tenantModel: asValue(Tenant),

    // Infrastructure
    hasher: asClass(BcryptHasher).singleton(),
    tokenManager: asClass(TokenManager).singleton(),
    userRepository: asClass(UserRepository).singleton(),

    // Use Cases
    adminRegisterUseCase: asClass(AdminRegisterUseCase).singleton(),
    adminLoginUseCase: asClass(AdminLoginUseCase).singleton(),
    userUseCases: asClass(UserUseCases).singleton(),
});

module.exports = container;
