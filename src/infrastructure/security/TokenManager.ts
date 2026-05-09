import jwt from 'jsonwebtoken';

export default class TokenManager {
    public generateToken(payload: any, expiresIn: string = '1d'): string {
        const secret = process.env.JWT_SECRET || 'fallback_secret';
        return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
    }

    public verifyToken(token: string): any {
        const secret = process.env.JWT_SECRET || 'fallback_secret';
        return jwt.verify(token, secret);
    }
}





