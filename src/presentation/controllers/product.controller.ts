import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { sendResponse } from '../../utils/responseHelper';
import { toProductListResponse, toProductResponse } from '../dtos/ProductDTO';

export const getProducts = asyncHandler(async (req: Request, res: Response) => {
    const { productUseCases } = req.container.cradle;
    const products = await productUseCases.getAllProducts(req.query);
    sendResponse(res, 200, 'Lấy danh sách sản phẩm thành công', toProductListResponse(products), { total: products.length });
});

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
    const { productUseCases } = req.container.cradle;
    
    const productData = {
        ...req.body,
        price: Number(req.body.price) || 0,
        stock: Number(req.body.stock) || 0,
        isActive: true
    };

    if (req.files && (req.files as any[]).length > 0) {
        productData.images = (req.files as any[]).map(file => `/uploads/products/${file.filename}`);
    } else {
        productData.images = ['/images/default-product.png'];
    }

    const newProduct = await productUseCases.createProduct(productData);
    sendResponse(res, 201, 'Tạo sản phẩm thành công', toProductResponse(newProduct));
});

export const getProductById = asyncHandler(async (req: Request, res: Response) => {
    const { productUseCases } = req.container.cradle;
    const product = await productUseCases.getProductById(req.params.id as string);
    
    if (!product) {
        throw new Error('Sản phẩm không tồn tại');
    }

    sendResponse(res, 200, 'Lấy chi tiết sản phẩm thành công', toProductResponse(product));
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
    const { productUseCases } = req.container.cradle;
    const updateData = { ...req.body };
    
    if (updateData.price) updateData.price = Number(updateData.price);
    if (updateData.stock) updateData.stock = Number(updateData.stock);

    if (req.files && (req.files as any[]).length > 0) {
        updateData.images = (req.files as any[]).map(file => `/uploads/products/${file.filename}`);
    }

    const updatedProduct = await productUseCases.updateProduct(req.params.id as string, updateData);
    sendResponse(res, 200, 'Cập nhật sản phẩm thành công', toProductResponse(updatedProduct));
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
    const { productUseCases } = req.container.cradle;
    await productUseCases.deleteProduct(req.params.id as string);
    sendResponse(res, 200, 'Đã xóa sản phẩm thành công');
});





