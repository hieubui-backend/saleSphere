import Email from '../value-objects/Email';

/**
 * Địa chỉ giao hàng có cấu trúc — hỗ trợ nhiều địa chỉ cho 1 Customer
 */
export interface ShippingAddress {
    _id?: string;
    label?: string;          // 'Nhà', 'Văn phòng', 'Kho'
    recipientName: string;   // Tên người nhận (có thể khác tên customer)
    phone: string;
    street: string;          // Số nhà, tên đường
    ward: string;            // Phường/Xã
    district: string;        // Quận/Huyện
    province: string;        // Tỉnh/Thành phố
    isDefault: boolean;
}

export interface CustomerEntityProps {
    id?: string;
    name: string;
    email: string | Email;
    password?: string;
    phone?: string;
    avatar?: string;
    gender?: 'male' | 'female' | 'other';
    dateOfBirth?: Date;
    addresses?: ShippingAddress[];
    isActive?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export default class CustomerEntity {
    public id?: string;
    public name: string;
    public email: string;
    public password?: string;
    public phone?: string;
    public avatar?: string;
    public gender?: 'male' | 'female' | 'other';
    public dateOfBirth?: Date;
    public addresses: ShippingAddress[];
    public isActive: boolean;

    constructor(props: CustomerEntityProps) {
        this.id = props.id;
        this.name = props.name;
        this.email = typeof props.email === 'string'
            ? new Email(props.email).getValue()
            : props.email.getValue();
        this.password = props.password;
        this.phone = props.phone;
        this.avatar = props.avatar;
        this.gender = props.gender;
        this.dateOfBirth = props.dateOfBirth;
        this.addresses = props.addresses ?? [];
        this.isActive = props.isActive ?? true;
    }

    public updateProfile(data: Partial<Pick<CustomerEntityProps, 'name' | 'phone' | 'avatar' | 'gender' | 'dateOfBirth'>>): void {
        if (data.name) this.name = data.name;
        if (data.phone) this.phone = data.phone;
        if (data.avatar) this.avatar = data.avatar;
        if (data.gender) this.gender = data.gender;
        if (data.dateOfBirth) this.dateOfBirth = data.dateOfBirth;
    }

    /**
     * Thêm địa chỉ giao hàng (tối đa 5)
     */
    public addAddress(address: Omit<ShippingAddress, '_id' | 'isDefault'>): void {
        if (this.addresses.length >= 5) {
            throw new Error('Chỉ được lưu tối đa 5 địa chỉ giao hàng');
        }
        // Nếu chưa có địa chỉ nào → tự động set làm mặc định
        const isDefault = this.addresses.length === 0;
        this.addresses.push({ ...address, isDefault });
    }

    /**
     * Đặt địa chỉ mặc định theo index
     */
    public setDefaultAddress(addressId: string): void {
        const found = this.addresses.find(a => a._id === addressId);
        if (!found) throw new Error('Không tìm thấy địa chỉ');
        this.addresses.forEach(a => { a.isDefault = false; });
        found.isDefault = true;
    }

    /**
     * Lấy địa chỉ mặc định
     */
    public getDefaultAddress(): ShippingAddress | undefined {
        return this.addresses.find(a => a.isDefault) ?? this.addresses[0];
    }

    /**
     * Xóa địa chỉ theo ID
     */
    public removeAddress(addressId: string): void {
        const index = this.addresses.findIndex(a => a._id === addressId);
        if (index === -1) throw new Error('Không tìm thấy địa chỉ');
        const wasDefault = this.addresses[index].isDefault;
        this.addresses.splice(index, 1);
        // Tự động đặt địa chỉ đầu tiên còn lại làm mặc định
        if (wasDefault && this.addresses.length > 0) {
            this.addresses[0].isDefault = true;
        }
    }

    public deactivate(): void { this.isActive = false; }
    public activate(): void { this.isActive = true; }
}
