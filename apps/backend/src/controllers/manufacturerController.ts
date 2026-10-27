import { Request, Response } from "express";
import { ManufacturerRepository } from "../repositories/manufacturerRepository";
import { redisClient } from "../config/redis";

export class ManufacturerController {
  private manufacturerRepo: ManufacturerRepository;
  private readonly CACHE_KEY = "manufacturers_all";

  constructor(manufacturerRepo: ManufacturerRepository) {
    this.manufacturerRepo = manufacturerRepo;
  }

  getAll = async (req: Request, res: Response) => {
    try {
      const cachedData = await redisClient.get(this.CACHE_KEY);

      if (cachedData) {
        res.status(200).json(JSON.parse(cachedData));
        return;
      }

      const data = await this.manufacturerRepo.findAll();

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
        res.status(400).json({ error: "Невалідний ID виробника" });
        return;
      }

      const data = await this.manufacturerRepo.findById(id);

      if (!data) {
        res.status(404).json({ error: "Виробника не знайдено" });
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

      if (!data.name) {
        res
          .status(400)
          .json({ error: "Назва виробника (name) є обов'язковою" });
        return;
      }

      const newManufacturer = await this.manufacturerRepo.create(data);

      await redisClient.del(this.CACHE_KEY);

      res.status(201).json(newManufacturer);
    } catch (error: any) {
      if (error.code === "23505") {
        res.status(409).json({ error: "Виробник з такою назвою вже існує" });
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
        res.status(400).json({ error: "Невалідний ID виробника" });
        return;
      }

      const existingManufacturer = await this.manufacturerRepo.findById(id);

      if (!existingManufacturer) {
        res.status(404).json({ error: "Виробника не знайдено" });
        return;
      }

      const updatedManufacturer = await this.manufacturerRepo.update(id, data);

      await redisClient.del(this.CACHE_KEY);

      res.status(200).json(updatedManufacturer);
    } catch (error: any) {
      if (error.code === "23505") {
        res.status(409).json({ error: "Виробник з такою назвою вже існує" });
        return;
      }
      res.status(500).json({ error: error.message });
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({ error: "Невалідний ID виробника" });
        return;
      }

      const existingManufacturer = await this.manufacturerRepo.findById(id);

      if (!existingManufacturer) {
        res.status(404).json({ error: "Виробника не знайдено" });
        return;
      }

      const success = await this.manufacturerRepo.delete(id);

      await redisClient.del(this.CACHE_KEY);

      res.status(200).json({ success });
    } catch (error: any) {
      if (error.code === "23503") {
        res.status(409).json({
          error:
            "Неможливо видалити виробника, оскільки до нього прив'язані моделі ОЗП у каталозі.",
        });
        return;
      }
      res.status(500).json({ error: error.message });
    }
  };
}
