import { pool } from "../config/db";
import { FormFactor } from "@ram-catalog/shared";

export class FormFactorRepository {
  async findAll(): Promise<FormFactor[]> {
    const query = `
      SELECT *
      FROM public.form_factors 
      ORDER BY form_factor_id DESC;
    `;

    const { rows } = await pool.query<FormFactor>(query);
    return rows;
  }

  async findById(id: number): Promise<FormFactor | null> {
    const query = `
      SELECT *
      FROM public.form_factors
      WHERE form_factor_id = $1;
    `;

    const { rows } = await pool.query<FormFactor>(query, [id]);
    return rows[0] || null;
  }

  async create(data: Omit<FormFactor, "form_factor_id">): Promise<FormFactor> {
    const query = `
      INSERT INTO public.form_factors 
      (form_factor_name, description, image_url)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;

    const values = [
      data.form_factor_name,
      data.description ?? null,
      data.image_url ?? null,
    ];

    const { rows } = await pool.query<FormFactor>(query, values);
    return rows[0];
  }

  async update(
    id: number,
    data: Partial<FormFactor>,
  ): Promise<FormFactor | null> {
    const query = `
      UPDATE public.form_factors
      SET 
        form_factor_name = COALESCE($1, form_factor_name),
        description = COALESCE($2, description),
        image_url = COALESCE($3, image_url)
      WHERE form_factor_id = $4
      RETURNING *;
    `;

    const values = [
      data.form_factor_name ?? null,
      data.description ?? null,
      data.image_url ?? null,
      id,
    ];

    const { rows } = await pool.query<FormFactor>(query, values);
    return rows[0] || null;
  }

  async delete(id: number): Promise<boolean> {
    const query = `DELETE FROM public.form_factors WHERE form_factor_id = $1;`;
    const result = await pool.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  }
}
