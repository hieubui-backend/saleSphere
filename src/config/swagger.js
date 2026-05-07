const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Salesphere API Documentation',
            version: '1.0.0',
            description: 'Tài liệu API hệ thống quản lý bán hàng Multi-tenant',
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
    apis: ['./src/modules/**/*.route.js'], // Tự động quét các file route
};

const specs = swaggerJsdoc(options);
module.exports = specs;