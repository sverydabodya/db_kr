import { Request, Response } from "express";
import { MemoryTypeRepository } from "../repositories/memoryTypeRepository";
import { redisClient } from "../config/redis";

export class MemoryTypeController {
  private memoryTypeRepo: MemoryTypeRepository;
  private readonly CACHE_KEY = "memoryTypes_all";

  constructor(memoryTypeRepo: MemoryTypeRepository) {
    this.memoryTypeRepo = memoryTypeRepo;
  }

  getAll = async (req: Request, res: Response) => {
    try {
      const cachedData = await redisClient.get(this.CACHE_KEY);

      if (cachedData) {
        res.status(200).json(JSON.parse(cachedData));
        return;
      }

      const data = await this.memoryTypeRepo.findAll();

      await redisClient.setEx(this.CACHE_KEY, 3600, JSON.stringify(data));

      res.status(200).json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  getById = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({ error: "Невалідний ID типу пам'яті" });
        return;
      }

      const data = await this.memoryTypeRepo.findById(id);

      if (!data) {
        res.status(404).json({ error: "Тип пам'яті не знайдено" });
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

      if (!data.type_name || data.default_voltage === undefined) {
        res.status(400).json({
          error:
            "Назва типу (type_name) та базова напруга (default_voltage) є обов'язковими",
        });
        return;
      }

      if (isNaN(Number(data.default_voltage))) {
        res
          .status(400)
          .json({ error: "Напруга (default_voltage) має бути числом" });
        return;
      }

      const newType = await this.memoryTypeRepo.create(data);

      await redisClient.del(this.CACHE_KEY);

      res.status(201).json(newType);
    } catch (error: any) {
      if (error.code === "23505") {
        res.status(409).json({ error: "Такий тип пам'яті вже існує" });
        return;
      }
      res.status(500).json({ error: error.message });
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const data = req.body;

      if (isNaN(id)) {
        res.status(400).json({ error: "Невалідний ID типу пам'яті" });
        return;
      }

      const existingType = await this.memoryTypeRepo.findById(id);

      if (!existingType) {
        res.status(404).json({ error: "Тип пам'яті не знайдено" });
        return;
      }

      const updatedType = await this.memoryTypeRepo.update(id, data);

      await redisClient.del(this.CACHE_KEY);

      res.status(200).json(updatedType);
    } catch (error: any) {
      if (error.code === "23505") {
        res.status(409).json({ error: "Такий тип пам'яті вже існує" });
        return;
      }
      res.status(500).json({ error: error.message });
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({ error: "Невалідний ID типу пам'яті" });
        return;
      }

      const existingType = await this.memoryTypeRepo.findById(id);

      if (!existingType) {
        res.status(404).json({ error: "Тип пам'яті не знайдено" });
        return;
      }

      const success = await this.memoryTypeRepo.delete(id);

      await redisClient.del(this.CACHE_KEY);

      res.status(200).json({ success });
    } catch (error: any) {
      if (error.code === "23503") {
        res.status(409).json({
          error:
            "Неможливо видалити цей тип, оскільки до нього прив'язані моделі ОЗП у каталозі.",
        });
        return;
      }
      res.status(500).json({ error: error.message });
    }
  };
}
