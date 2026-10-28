import fs from "fs";
import path from "path";
import { Request, Response } from "express";
import { RamRepository } from "../repositories/ramRepository";
import { redisClient } from "../config/redis";
import { ElasticService } from "../services/elasticService";

export class RamController {
  constructor(ramRepo: RamRepository) {
    this.ramRepo = ramRepo;
    this.elasticService = new ElasticService();
  }
  private ramRepo: RamRepository;
  private readonly CACHE_KEY = "rams_all";
  private elasticService: ElasticService;

  getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      if (
        req.query.search &&
        typeof req.query.search === "string" &&
        req.query.search.trim() !== ""
      ) {
        console.log("elastic");

        const filters = req.query;

        const models = await this.elasticService.searchWithFilters(filters);

        res.json(models);
        return;
      }

      const cachedData = await redisClient.get(this.CACHE_KEY);

      if (cachedData) {
        res.status(200).json(JSON.parse(cachedData));
        console.log("redis");

        return;
      }

      const data = await this.ramRepo.findAll();

      await redisClient.setEx(this.CACHE_KEY, 3600, JSON.stringify(data));

      console.log("postgres");

      res.status(200).json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  getById = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({ error: "Невалідний ID моделі" });
        return;
      }

      const data = await this.ramRepo.findById(id);

      if (!data) {
        res.status(404).json({ error: "Модель ОЗП не знайдено" });
        return;
      }

      res.status(200).json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      const data = req.body;

      if (
        !data.manufacturer_id ||
        !data.type_id ||
        !data.form_factor_id ||
        !data.model_name ||
        !data.capacity_gb ||
        !data.frequency_mhz
      ) {
        res
          .status(400)
          .json({ error: "Бракує обов'язкових технічних характеристик" });
        return;
      }

      const newRam = await this.ramRepo.create(data);

      await redisClient.del(this.CACHE_KEY);

      const fullRam = await this.ramRepo.findById(newRam.ram_id);
      if (fullRam) {
        await this.elasticService.addOrUpdateDocument(fullRam);
      }

      res.status(201).json(newRam);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const data = req.body;

      if (isNaN(id)) {
        res.status(400).json({ error: "Невалідний ID моделі" });
        return;
      }

      const existingRam = await this.ramRepo.findById(id);

      if (!existingRam) {
        res.status(404).json({ error: "Модель ОЗП не знайдено" });
        return;
      }

      const updatedRam = await this.ramRepo.update(id, data);

      await redisClient.del(this.CACHE_KEY);

      const fullRam = await this.ramRepo.findById(id);
      if (fullRam) {
        await this.elasticService.addOrUpdateDocument(fullRam);
      }

      res.status(201).json(updatedRam);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({ error: "Невалідний ID моделі" });
        return;
      }

      const existingRam = await this.ramRepo.findById(id);

      if (!existingRam) {
        res.status(404).json({ error: "Модель ОЗП не знайдено" });
        return;
      }

      const success = await this.ramRepo.delete(id);

      await redisClient.del(this.CACHE_KEY);

      if (success) {
        await this.elasticService.deleteDocument(id);

        if (existingRam.image_url) {
          try {
            const relativeFilePath = existingRam.image_url.replace(
              "/uploads/",
              "",
            );

            const uploadDir =
              process.env.UPLOAD_DIR || path.join(__dirname, "../uploads");

            const fullPath = path.join(uploadDir, relativeFilePath);

            if (fs.existsSync(fullPath)) {
              fs.unlinkSync(fullPath);
              console.log(`Файл ${fullPath} успішно видалено.`);
            }
          } catch (fileErr) {
            console.error("Помилка при фізичному видаленні фото:", fileErr);
          }
        }
      }

      res
        .status(200)
        .json({ success: true, message: "Модель та її фото успішно видалено" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };
}
