import bcrypt from 'bcryptjs';

export default class BcryptHasher {
    public async hash(password: string): Promise<string> {
        return await bcrypt.hash(password, 10);
    }

    public async compare(password: string, hashedPassword?: string): Promise<boolean> {
        if (!hashedPassword) return false;
        return await bcrypt.compare(password, hashedPassword);
    }
}





