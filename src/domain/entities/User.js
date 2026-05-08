const Email = require('../value-objects/Email');

class User {
    constructor({ id, name, email, password, role, isActive = true }) {
        this.id = id;
        this.name = name;
        this.email = typeof email === 'string' ? new Email(email).getValue() : email;
        this.password = password; // Hashed
        this.role = role; // admin, staff
        this.isActive = isActive;
    }

    hasRole(requiredRole) {
        return this.role === requiredRole;
    }

    deactivate() {
        if (this.role === 'admin') {
            throw new Error('Không thể vô hiệu hóa tài khoản admin cao nhất');
        }
        this.isActive = false;
    }
}

module.exports = User;
