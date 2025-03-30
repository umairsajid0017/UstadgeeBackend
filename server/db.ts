import { drizzle } from 'drizzle-orm/neon-serverless';
import { neon } from '@neondatabase/serverless';
import { PrismaClient } from '@prisma/client';

// Create a Prisma client instance for compatibility with existing code
const prisma = new PrismaClient();

// Create a Drizzle client as well
const connectionString = process.env.DATABASE_URL || '';
const sql = neon(connectionString);
export const db = drizzle(sql);

export default prisma;