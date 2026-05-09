import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IUser extends Document {
    name: string;
    email: string;
    password?: string;
    role: 'admin' | 'staff';
    createdAt: Date;
}

const UserSchema: Schema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { 
        type: String, 
        enum: ['admin', 'staff'], 
        default: 'admin' 
    }
}, { 
    timestamps: true 
});

const UserModel: Model<IUser> = mongoose.model<IUser>('UserEntity', UserSchema);

export default UserModel;





