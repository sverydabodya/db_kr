import express from "express";
import cors from "cors";
import { checkDbConnection } from "./config/db";
import { connectRedis } from "./config/redis";
import { connectElastic } from "./config/elastic";
import MainRouter from "./routes";
import { ElasticService } from "./services/elasticService";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());

app.use("/api", MainRouter);

const startServer = async () => {
  await checkDbConnection();
  await connectRedis();
  await connectElastic();

  const elasticService = new ElasticService();
  await elasticService.init();

  app.listen(PORT, () => {
    console.log(`🚀 Сервер запущено на http://localhost:${PORT}`);
  });
};

startServer();
