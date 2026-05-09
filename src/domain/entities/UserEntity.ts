import Email from '../value-objects/Email';

export interface UserEntityProps {
    id?: string;
    name: string;
    email: string | Email;
    password?: string;
    role: 'admin' | 'staff';
    isActive?: boolean;
}

export default class UserEntity {
    public id?: string;
    public name: string;
    public email: string;
    public password?: string;
    public role: 'admin' | 'staff';
    public isActive: boolean;

    constructor({ id, name, email, password, role, isActive = true }: UserEntityProps) {
        this.id = id;
        this.name = name;
        this.email = typeof email === 'string' ? new Email(email).getValue() : email.getValue();
        this.password = password;
        this.role = role;
        this.isActive = isActive;
    }

    public hasRole(requiredRole: string): boolean {
        return this.role === requiredRole;
    }

    public deactivate(): void {
        if (this.role === 'admin') {
            throw new Error('Không thể vô hiệu hóa tài khoản admin cao nhất');
        }
        this.isActive = false;
    }
}





