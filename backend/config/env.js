import { config } from 'dotenv';

import path from 'path';

const envPath = path.join(process.cwd(), `.env.${process.env.NODE_ENV || 'development'}.local`);
console.log("Loading env from:", envPath);
config({ path: envPath });


export const {
    MONGO_URI ,
    PORT,
    JWT_SECRET,
    JWT_EXPIRES_IN
} = process.env;