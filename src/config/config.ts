import dotenv from 'dotenv';
dotenv.config();

interface Config {
    env: string;
    port: number | string;
    mongoUri: string;
    jwtSecret: string;
    jwtExpiresIn: string;
    sessionSecret: string;
    logLevel: string;
    corsOrigin: string;
}

const config: Config = {
    env: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 5000,
    mongoUri: process.env.MONGO_URI as string,
    jwtSecret: process.env.JWT_SECRET || 'salesphere_secret_key',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
    sessionSecret: process.env.SESSION_SECRET || 'salesphere_session_secret',
    logLevel: process.env.LOG_LEVEL || 'info',
    corsOrigin: process.env.CORS_ORIGIN || '*'
};

// Validate required env variables
if (!config.mongoUri) {
    console.error(`❌ Missing required environment variable: MONGO_URI`);
    process.exit(1);
}

export default config;





