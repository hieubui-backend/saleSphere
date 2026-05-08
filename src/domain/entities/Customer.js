const Email = require('../value-objects/Email');

class Customer {
    constructor({ id, name, email, password, phone, address, isActive = true }) {
        this.id = id;
        this.name = name;
        this.email = typeof email === 'string' ? new Email(email).getValue() : email; // Có thể nhận string hoặc VO
        this.password = password; // Hashed
        this.phone = phone;
        this.address = address;
        this.isActive = isActive;
    }

    updateProfile({ name, phone, address }) {
        if (name) this.name = name;
        if (phone) this.phone = phone;
        if (address) this.address = address;
    }

    deactivate() {
        this.isActive = false;
    }

    activate() {
        this.isActive = true;
    }
}

module.exports = Customer;
