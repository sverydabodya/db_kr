import { Request, Response } from "express";
import { pool } from "../config/db";

export const getFeatureDefinitions = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT feature_id, feature_name, display_type, options
       FROM feature_definitions ORDER BY feature_name ASC`,
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Помилка отримання конфігурації характеристик:", error);
    res.status(500).json({ error: "Внутрішня помилка сервера" });
  }
};

export const createFeatureDefinition = async (req: Request, res: Response) => {
  try {
    const { feature_name, display_type, options } = req.body;

    if (!feature_name || !display_type) {
      return res
        .status(400)
        .json({ error: "Назва та тип відображення обов'язкові" });
    }

    const optionsJson =
      options && Array.isArray(options) ? JSON.stringify(options) : null;

    const result = await pool.query(
      `INSERT INTO feature_definitions (feature_name, display_type, options) 
        VALUES ($1, $2, $3) RETURNING *`,
      [feature_name.trim(), display_type, optionsJson],
    );

    res.status(201).json({
      message: "Характеристику успішно створено!",
      data: result.rows[0],
    });
  } catch (error: any) {
    console.error("Помилка створення характеристики:", error);
    if (error.code === "23505") {
      return res
        .status(400)
        .json({ error: "Характеристика з такою назвою вже існує" });
    }
    res.status(500).json({ error: "Внутрішня помилка сервера" });
  }
};

export const updateFeatureDefinition = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { feature_name, display_type, options } = req.body;

    const optionsJson =
      options && Array.isArray(options) ? JSON.stringify(options) : null;

    const result = await pool.query(
      `UPDATE feature_definitions 
       SET feature_name = $1, display_type = $2, options = $3
       WHERE feature_id = $4 RETURNING *`,
      [feature_name.trim(), display_type, optionsJson, id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Характеристику не знайдено" });
    }

    res.json({
      message: "Характеристику успішно оновлено!",
      data: result.rows[0],
    });
  } catch (error: any) {
    console.error("Помилка оновлення характеристики:", error);
    if (error.code === "23505") {
      return res
        .status(400)
        .json({ error: "Характеристика з такою назвою вже існує" });
    }
    res.status(500).json({ error: "Внутрішня помилка сервера" });
  }
};

export const deleteFeatureDefinition = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM feature_definitions WHERE feature_id = $1 RETURNING *",
      [id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Характеристику не знайдено" });
    }

    res.json({ message: "Характеристику успішно видалено!" });
  } catch (error) {
    console.error("Помилка видалення характеристики:", error);
    res.status(500).json({ error: "Внутрішня помилка сервера" });
  }
};

