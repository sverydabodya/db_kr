import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

export const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redisClient.on("error", (err) => {
  console.error("❌ Помилка підключення до Redis:", err);
});

export const connectRedis = async () => {
  try {
    await redisClient.connect();
    console.log("✅ Підключено до Redis кешу");
  } catch (error) {
    console.error("❌ Не вдалося підключитися до Redis:", error);
  }
};
