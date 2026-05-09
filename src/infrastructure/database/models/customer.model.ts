import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ICustomer extends Document {
    name: string;
    email: string;
    password?: string;
    phone?: string;
    address?: string;
    isActive: boolean;
    createdAt: Date;
}

const customerSchema: Schema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true }, 
    password: { type: String, required: true },
    phone: { type: String },
    address: { type: String },
    isActive: { type: Boolean, default: true }
}, { 
    timestamps: true 
});

const CustomerModel: Model<ICustomer> = mongoose.model<ICustomer>('CustomerEntity', customerSchema);

export default CustomerModel;





