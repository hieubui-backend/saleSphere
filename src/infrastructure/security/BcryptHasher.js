const bcrypt = require('bcryptjs');

class BcryptHasher {
    async hash(password) {
        return await bcrypt.hash(password, 10);
    }

    async compare(password, hashedPassword) {
        return await bcrypt.compare(password, hashedPassword);
    }
}

module.exports = BcryptHasher;
