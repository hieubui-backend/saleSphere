/**
 * @swagger
 * components:
 *   schemas:
 *     ApiResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: object
 *         metadata:
 *           type: object
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: "Thông báo lỗi chi tiết"
 *         error:
 *           type: object
 *           description: Chi tiết lỗi (chỉ có ở môi trường development)
 *         stack:
 *           type: string
 *           description: Stack trace (chỉ có ở môi trường development)
 *
 *     Product:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         price:
 *           type: number
 *         stock:
 *           type: integer
 *         description:
 *           type: string
 *         images:
 *           type: array
 *           items:
 *             type: string
 *         category:
 *           type: string
 *         isActive:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     Order:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         customerId:
 *           type: string
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderItem'
 *         totalAmount:
 *           type: number
 *         status:
 *           type: string
 *           enum: [PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED, RETURNED, DISPUTED]
 *         shippingAddress:
 *           type: string
 *         paymentMethod:
 *           type: string
 *         paymentStatus:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     OrderItem:
 *       type: object
 *       properties:
 *         productId:
 *           type: string
 *         name:
 *           type: string
 *         price:
 *           type: number
 *         quantity:
 *           type: integer
 *         image:
 *           type: string
 *
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         role:
 *           type: string
 *           enum: [admin, staff]
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     AuthResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         token:
 *           type: string
 *         user:
 *           $ref: '#/components/schemas/User'
 *
 *     Customer:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         phone:
 *           type: string
 *         address:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     CartItem:
 *       type: object
 *       properties:
 *         productId:
 *           type: string
 *         name:
 *           type: string
 *         price:
 *           type: number
 *         quantity:
 *           type: integer
 *         image:
 *           type: string
 *
 *   responses:
 *     BadRequest:
 *       description: Dữ liệu đầu vào không hợp lệ (400)
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ErrorResponse'
 *     Unauthorized:
 *       description: Chưa đăng nhập hoặc Token sai/hết hạn (401)
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ErrorResponse'
 *     Forbidden:
 *       description: Không có quyền truy cập (403)
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ErrorResponse'
 *     NotFound:
 *       description: Không tìm thấy tài nguyên (404)
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ErrorResponse'
 *     InternalServerError:
 *       description: Lỗi máy chủ (500)
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ErrorResponse'
 */
