const jwt = require('jsonwebtoken');

class TokenManager {
    generateToken(payload, expiresIn = '1d') {
        // Lấy secret từ process.env (có thể inject ConfigService sau này)
        return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
    }

    verifyToken(token) {
        return jwt.verify(token, process.env.JWT_SECRET);
    }
}

module.exports = TokenManager;
