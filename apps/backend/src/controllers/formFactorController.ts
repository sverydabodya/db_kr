import { Request, Response } from "express";
import { FormFactorRepository } from "../repositories/formFactorRepository";
import { redisClient } from "../config/redis";

export class FormFactorController {
  private formFactorRepo: FormFactorRepository;
  private readonly CACHE_KEY = "formFactors_all";

  constructor(formFactorRepo: FormFactorRepository) {
    this.formFactorRepo = formFactorRepo;
  }

  getAll = async (req: Request, res: Response) => {
    try {
      const cachedData = await redisClient.get(this.CACHE_KEY);

      if (cachedData) {
        res.status(200).json(JSON.parse(cachedData));
        return;
      }

      const data = await this.formFactorRepo.findAll();

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
        res.status(400).json({ error: "Невалідний ID формфактора" });
        return;
      }

      const data = await this.formFactorRepo.findById(id);

      if (!data) {
        res.status(404).json({ error: "Формфактор не знайдено" });
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

      if (!data.form_factor_name) {
        res.status(400).json({
          error: "Назва формфактора (form_factor_name) є обов'язковою",
        });
        return;
      }

      const newFormFactor = await this.formFactorRepo.create(data);

      await redisClient.del(this.CACHE_KEY);

      res.status(201).json(newFormFactor);
    } catch (error: any) {
      if (error.code === "23505") {
        res.status(409).json({ error: "Такий формфактор вже існує" });
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
        res.status(400).json({ error: "Невалідний ID формфактора" });
        return;
      }

      const existingFormFactor = await this.formFactorRepo.findById(id);

      if (!existingFormFactor) {
        res.status(404).json({ error: "Формфактор не знайдено" });
        return;
      }

      const updatedFormFactor = await this.formFactorRepo.update(id, data);

      await redisClient.del(this.CACHE_KEY);

      res.status(200).json(updatedFormFactor);
    } catch (error: any) {
      if (error.code === "23505") {
        res.status(409).json({ error: "Такий формфактор вже існує" });
        return;
      }
      res.status(500).json({ error: error.message });
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({ error: "Невалідний ID формфактора" });
        return;
      }

      const existingFormFactor = await this.formFactorRepo.findById(id);

      if (!existingFormFactor) {
        res.status(404).json({ error: "Формфактор не знайдено" });
        return;
      }

      const success = await this.formFactorRepo.delete(id);

      await redisClient.del(this.CACHE_KEY);

      res.status(200).json({ success });
    } catch (error: any) {
      if (error.code === "23503") {
        res.status(409).json({
          error:
            "Неможливо видалити цей формфактор, оскільки до нього прив'язані моделі ОЗП.",
        });
        return;
      }
      res.status(500).json({ error: error.message });
    }
  };
}
