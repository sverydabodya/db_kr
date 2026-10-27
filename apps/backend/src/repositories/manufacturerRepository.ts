import { pool } from "../config/db";
import { Manufacturer } from "@ram-catalog/shared";

export class ManufacturerRepository {
  async findAll(): Promise<Manufacturer[]> {
    const query = `
      SELECT *
      FROM public.manufacturers 
      ORDER BY manufacturer_id DESC;
    `;

    const { rows } = await pool.query<Manufacturer>(query);
    return rows;
  }

  async findById(id: number): Promise<Manufacturer | null> {
    const query = `
      SELECT *
      FROM public.manufacturers
      WHERE manufacturer_id = $1;
    `;

    const { rows } = await pool.query<Manufacturer>(query, [id]);
    return rows[0] || null;
  }

  async create(
    data: Omit<Manufacturer, "manufacturer_id">,
  ): Promise<Manufacturer> {
    const query = `
      INSERT INTO public.manufacturers 
      (name, country, website, description, logo_url)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;

    const values = [
      data.name,
      data.country ?? null,
      data.website ?? null,
      data.description ?? null,
      data.logo_url ?? null,
    ];

    const { rows } = await pool.query<Manufacturer>(query, values);
    return rows[0];
  }

  async update(
    id: number,
    data: Partial<Manufacturer>,
  ): Promise<Manufacturer | null> {
    const query = `
      UPDATE public.manufacturers
      SET 
        name = COALESCE($1, name),
        country = COALESCE($2, country),
        website = COALESCE($3, website),
        description = COALESCE($4, description),
        logo_url = COALESCE($5, logo_url)
      WHERE manufacturer_id = $6
      RETURNING *;
    `;

    const values = [
      data.name ?? null,
      data.country ?? null,
      data.website ?? null,
      data.description ?? null,
      data.logo_url ?? null,
      id,
    ];

    const { rows } = await pool.query<Manufacturer>(query, values);
    return rows[0] || null;
  }

  async delete(id: number): Promise<boolean> {
    const query = `DELETE FROM public.manufacturers WHERE manufacturer_id = $1;`;
    const result = await pool.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  }
}
