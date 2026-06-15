import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IShippingAddress {
    _id?: mongoose.Types.ObjectId;
    label?: string;
    recipientName: string;
    phone: string;
    street: string;
    ward: string;
    district: string;
    province: string;
    isDefault: boolean;
}

export interface ICustomer extends Document {
    name: string;
    email: string;
    password?: string;
    phone?: string;
    avatar?: string;
    gender?: 'male' | 'female' | 'other';
    dateOfBirth?: Date;
    addresses: IShippingAddress[];
    refreshToken?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const shippingAddressSchema = new Schema({
    label: { type: String, trim: true },             // 'Nhà', 'Văn phòng'
    recipientName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    street: { type: String, required: true, trim: true },
    ward: { type: String, required: true, trim: true },
    district: { type: String, required: true, trim: true },
    province: { type: String, required: true, trim: true },
    isDefault: { type: Boolean, default: false }
}, { _id: true });

const customerSchema: Schema = new Schema({
    name: { type: String, required: true, trim: true },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    password: {
        type: String,
        required: true,
        select: false   // SECURITY: không trả về password trong query mặc định
    },
    phone: { type: String, trim: true },
    avatar: { type: String },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    dateOfBirth: { type: Date },
    // Mảng địa chỉ giao hàng — tối đa 5, enforce bằng validation ở Domain layer
    addresses: {
        type: [shippingAddressSchema],
        default: [],
        validate: {
            validator: (arr: any[]) => arr.length <= 5,
            message: 'Chỉ được lưu tối đa 5 địa chỉ giao hàng'
        }
    },
    refreshToken: {
        type: String,
        select: false   // SECURITY: không trả về refresh token
    },
    isActive: { type: Boolean, default: true, index: true }
}, {
    timestamps: true
});

const CustomerModel: Model<ICustomer> = mongoose.model<ICustomer>('CustomerEntity', customerSchema);

export default CustomerModel;
