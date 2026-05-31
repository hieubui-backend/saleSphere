import swaggerJsdoc from 'swagger-jsdoc';

import path from 'path';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Salesphere API Documentation',
            version: '1.0.0',
            description: 'Tài liệu API hệ thống quản lý bán hàng',
        },
        servers: [
            {
                url: `http://localhost:${process.env.PORT || 5000}`,
                description: 'Local server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
    },
    apis: [
        path.join(__dirname, './swagger-schemas.*'),
        path.join(__dirname, '../presentation/routes/**/*.*')
    ], // Tự động quét các file schema và route TS/JS
};

const specs = swaggerJsdoc(options);
export default specs;





