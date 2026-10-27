import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

export const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "postgres",
  database: process.env.DB_NAME || "ram",
  password: process.env.DB_PASSWORD || "123",
  port: Number(process.env.DB_PORT) || 5432,
  max: 20,
  idleTimeoutMillis: 30000,
});

export const checkDbConnection = async () => {
  try {
    const client = await pool.connect();
    console.log("✅ Підключено до бази даних PostgreSQL");
    client.release();
  } catch (error) {
    console.error("❌ Помилка підключення до PostgreSQL:", error);
    process.exit(1);
  }
};
