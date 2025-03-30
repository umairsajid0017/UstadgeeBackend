import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { PrismaClient } from '@prisma/client';

// Create a Prisma client instance for compatibility with existing code
const prisma = new PrismaClient();

// Create a Drizzle client as well
const connectionString = process.env.DATABASE_URL || '';
const client = postgres(connectionString);
export const db = drizzle(client);

export default prisma;