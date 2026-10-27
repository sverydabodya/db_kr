import { pool } from "../config/db";
import { MemoryType } from "@ram-catalog/shared";

export class MemoryTypeRepository {
  async findAll(): Promise<MemoryType[]> {
    const query = `
      SELECT *
      FROM public.memory_types 
      ORDER BY type_id DESC;
    `;

    const { rows } = await pool.query<MemoryType>(query);
    return rows;
  }

  async findById(id: number): Promise<MemoryType | null> {
    const query = `
      SELECT *
      FROM public.memory_types
      WHERE type_id = $1;
    `;

    const { rows } = await pool.query<MemoryType>(query, [id]);
    return rows[0] || null;
  }

  async create(data: Omit<MemoryType, "type_id">): Promise<MemoryType> {
    const query = `
      INSERT INTO public.memory_types 
      (type_name, default_voltage, description, image_url)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;

    const values = [
      data.type_name,
      data.default_voltage,
      data.description ?? null,
      data.image_url ?? null,
    ];

    const { rows } = await pool.query<MemoryType>(query, values);
    return rows[0];
  }

  async update(
    id: number,
    data: Partial<MemoryType>,
  ): Promise<MemoryType | null> {
    const query = `
      UPDATE public.memory_types
      SET 
        type_name = COALESCE($1, type_name),
        default_voltage = COALESCE($2, default_voltage),
        description = COALESCE($3, description),
        image_url = COALESCE($4, image_url)
      WHERE type_id = $5
      RETURNING *;
    `;

    const values = [
      data.type_name ?? null,
      data.default_voltage ?? null,
      data.description ?? null,
      data.image_url ?? null,
      id,
    ];

    const { rows } = await pool.query<MemoryType>(query, values);
    return rows[0] || null;
  }

  async delete(id: number): Promise<boolean> {
    const query = `DELETE FROM public.memory_types WHERE type_id = $1;`;
    const result = await pool.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  }
}
