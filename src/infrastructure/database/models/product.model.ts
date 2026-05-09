import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IProduct extends Document {
    name: string;
    price: number;
    stock: number;
    description?: string;
    images: string[];
    category?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const productSchema: Schema = new Schema({
    name: { 
        type: String, 
        required: [true, 'Tên sản phẩm không được để trống'],
        trim: true 
    },
    price: { 
        type: Number, 
        required: [true, 'Giá sản phẩm là bắt buộc'],
        min: [0, 'Giá sản phẩm không được nhỏ hơn 0']
    },
    stock: { 
        type: Number, 
        default: 0, 
        min: [0, 'Số lượng tồn kho không được nhỏ hơn 0'] 
    },
    description: { 
        type: String,
        trim: true
    },
    images: [{ 
        type: String,
        default: ['/images/default-product.png'] 
    }],
    category: { 
        type: String,
        index: true 
    },
    isActive: {
        type: Boolean,
        default: true 
    }
}, { 
    timestamps: true 
});

productSchema.index({ name: 'text' }); 

const ProductModel: Model<IProduct> = mongoose.model<IProduct>('ProductEntity', productSchema);

export default ProductModel;





