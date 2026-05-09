import Email from '../value-objects/Email';

export interface CustomerEntityProps {
    id?: string;
    name: string;
    email: string | Email;
    password?: string;
    phone?: string;
    address?: string;
    isActive?: boolean;
}

export default class CustomerEntity {
    public id?: string;
    public name: string;
    public email: string;
    public password?: string;
    public phone?: string;
    public address?: string;
    public isActive: boolean;

    constructor({ id, name, email, password, phone, address, isActive = true }: CustomerEntityProps) {
        this.id = id;
        this.name = name;
        this.email = typeof email === 'string' ? new Email(email).getValue() : email.getValue();
        this.password = password;
        this.phone = phone;
        this.address = address;
        this.isActive = isActive;
    }

    public updateProfile({ name, phone, address }: Partial<Pick<CustomerEntityProps, 'name' | 'phone' | 'address'>>): void {
        if (name) this.name = name;
        if (phone) this.phone = phone;
        if (address) this.address = address;
    }

    public deactivate(): void {
        this.isActive = false;
    }

    public activate(): void {
        this.isActive = true;
    }
}





