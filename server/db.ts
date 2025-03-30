import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../shared/schema";

// Create PostgreSQL connection client
const connectionString = process.env.DATABASE_URL || '';
const client = postgres(connectionString, { max: 10 });

// Create Drizzle instance with the client
export const db = drizzle(client, { schema });

// Initialize database with required data
export async function initializeDatabase() {
  try {
    // Check if user_type table has data
    const userTypes = await db.select().from(schema.userTypes).limit(1);
    
    // If no user types exist, create them
    if (userTypes.length === 0) {
      await db.insert(schema.userTypes).values([
        { name: 'User' },
        { name: 'Ustadgee' },
        { name: 'Karigar' }
      ]);
      console.log('User types initialized');
    }

    // Check if status table has data
    const statuses = await db.select().from(schema.statuses).limit(1);
    
    // If no statuses exist, create them
    if (statuses.length === 0) {
      await db.insert(schema.statuses).values([
        { name: 'Pending', createdAt: new Date() },
        { name: 'Accepted', createdAt: new Date() },
        { name: 'In Progress', createdAt: new Date() },
        { name: 'Completed', createdAt: new Date() },
        { name: 'Cancelled', createdAt: new Date() }
      ]);
      console.log('Statuses initialized');
    }
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}