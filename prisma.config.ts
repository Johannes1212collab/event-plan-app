
import { defineConfig } from '@prisma/config';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
    schema: 'prisma/schema.prisma',
    datasource: {
        // @ts-ignore
        provider: 'postgresql',
        url: process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL,
        // @ts-ignore
        directUrl: process.env.POSTGRES_URL_NON_POOLING,
    },
});
