import winston from 'winston';
import path from 'path';
import config from '../../config/config';

const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

const logger = winston.createLogger({
    level: config.logLevel,
    format: logFormat,
    defaultMeta: { service: 'salesphere-backend' },
    transports: [
        new winston.transports.File({ 
            filename: path.join('logs', 'error.log'), 
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        new winston.transports.File({ 
            filename: path.join('logs', 'combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
    ],
});

if (config.env !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
            winston.format.printf(({ level, message, timestamp, stack }) => {
                return `${timestamp} ${level}: ${stack || message}`;
            })
        ),
    }));
}

export default logger;





