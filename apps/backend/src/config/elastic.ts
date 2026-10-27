import { Client } from "@elastic/elasticsearch";
import dotenv from "dotenv";

dotenv.config();

export const elasticClient = new Client({
  node: process.env.ELASTIC_URL || "http://localhost:9200",
});

export const connectElastic = async (retries = 10, delayMs = 5000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const health = await elasticClient.cluster.health({});
      console.log(
        `✅ Підключено до Elasticsearch (Статус кластера: ${health.status})`,
      );
      return;
    } catch (error) {
      console.log(
        `⏳ Elasticsearch ще завантажується... (Спроба ${i + 1} з ${retries})`,
      );

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  console.error(
    "❌ Не вдалося підключитися до Elasticsearch після всіх спроб.",
  );
  process.exit(1);
};
