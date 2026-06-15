import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IUser extends Document {
    name: string;
    email: string;
    password?: string;
    role: 'admin' | 'staff';
    lastLoginAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema: Schema = new Schema({
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
    role: {
        type: String,
        enum: ['admin', 'staff'],
        default: 'staff'
    },
    lastLoginAt: { type: Date }
}, {
    timestamps: true
});

const UserModel: Model<IUser> = mongoose.model<IUser>('UserEntity', UserSchema);

export default UserModel;
