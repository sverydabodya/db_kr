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
      if (req.query.search) {
        const queryText = String(req.query.search);
        const searchResults = await this.elasticService.search(queryText);
        res.status(200).json(searchResults);
        return;
      }

      const filters = {
        manufacturer_id: req.query.manufacturer_id
          ? Number(req.query.manufacturer_id)
          : undefined,
        type_id: req.query.type_id ? Number(req.query.type_id) : undefined,
        form_factor_id: req.query.form_factor_id
          ? Number(req.query.form_factor_id)
          : undefined,
        min_capacity: req.query.min_capacity
          ? Number(req.query.min_capacity)
          : undefined,
        min_frequency: req.query.min_frequency
          ? Number(req.query.min_frequency)
          : undefined,
        has_rgb:
          req.query.has_rgb !== undefined
            ? req.query.has_rgb === "true"
            : undefined,
        profile: req.query.profile ? String(req.query.profile) : undefined,
      };

      const filterString = JSON.stringify(filters);
      const dynamicCacheKey = `${this.CACHE_KEY}_${filterString}`;

      const cachedData = await redisClient.get(dynamicCacheKey);

      if (cachedData) {
        res.status(200).json(JSON.parse(cachedData));
        return;
      }

      const data = await this.ramRepo.findAll(filters);

      await redisClient.setEx(dynamicCacheKey, 3600, JSON.stringify(data));

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
      }

      res.status(201).json(success);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };
}
