import { pool } from "../config/db";
import { RamModel } from "@ram-catalog/shared";

export interface RamFilterParams {
  manufacturer_id?: number;
  type_id?: number;
  form_factor_id?: number;
  min_capacity?: number;
  min_frequency?: number;
  has_rgb?: boolean;
  profile?: string;
  search?: string;
}

export class RamRepository {
  async findAll(filters: RamFilterParams = {}): Promise<RamModel[]> {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (filters.manufacturer_id) {
      conditions.push(`r.manufacturer_id = $${paramIndex++}`);
      values.push(filters.manufacturer_id);
    }
    if (filters.type_id) {
      conditions.push(`r.type_id = $${paramIndex++}`);
      values.push(filters.type_id);
    }
    if (filters.form_factor_id) {
      conditions.push(`r.form_factor_id = $${paramIndex++}`);
      values.push(filters.form_factor_id);
    }
    if (filters.min_capacity) {
      conditions.push(`r.capacity_gb >= $${paramIndex++}`);
      values.push(filters.min_capacity);
    }
    if (filters.min_frequency) {
      conditions.push(`r.frequency_mhz >= $${paramIndex++}`);
      values.push(filters.min_frequency);
    }
    if (filters.has_rgb !== undefined) {
      conditions.push(`r.extra_features @> $${paramIndex++}::jsonb`);
      values.push(JSON.stringify({ has_rgb: filters.has_rgb }));
    }
    if (filters.profile) {
      conditions.push(`r.extra_features @> $${paramIndex++}::jsonb`);
      values.push(JSON.stringify({ profiles: [filters.profile] }));
    }
    if (filters.search) {
      conditions.push(`r.model_name ILIKE $${paramIndex++}`);
      values.push(`%${filters.search}%`);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const query = `
      SELECT 
        r.*,
        m.name AS manufacturer_name,
        mt.type_name,
        ff.form_factor_name
      FROM public.ram_models r
      LEFT JOIN public.manufacturers m ON r.manufacturer_id = m.manufacturer_id
      LEFT JOIN public.memory_types mt ON r.type_id = mt.type_id
      LEFT JOIN public.form_factors ff ON r.form_factor_id = ff.form_factor_id
      ${whereClause}
      ORDER BY r.ram_id DESC;
    `;

    const { rows } = await pool.query<RamModel>(query, values);
    return rows;
  }

  async findById(id: number): Promise<RamModel | null> {
    const query = `
      SELECT 
        r.*,
        m.name AS manufacturer_name,
        mt.type_name,
        ff.form_factor_name
      FROM public.ram_models r
      LEFT JOIN public.manufacturers m ON r.manufacturer_id = m.manufacturer_id
      LEFT JOIN public.memory_types mt ON r.type_id = mt.type_id
      LEFT JOIN public.form_factors ff ON r.form_factor_id = ff.form_factor_id
      WHERE r.ram_id = $1;
    `;
    const { rows } = await pool.query<RamModel>(query, [id]);
    return rows[0] || null;
  }

  async create(
    data: Omit<RamModel, "ram_id" | "created_at" | "updated_at">,
  ): Promise<RamModel> {
    const query = `
      INSERT INTO public.ram_models (
        manufacturer_id, type_id, form_factor_id, model_name,
        capacity_gb, frequency_mhz, cas_latency, extra_features,
        description, image_url
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10)
      RETURNING *;
    `;

    const values = [
      data.manufacturer_id,
      data.type_id,
      data.form_factor_id,
      data.model_name,
      data.capacity_gb,
      data.frequency_mhz,
      data.cas_latency ?? null,
      JSON.stringify(data.extra_features || {}),
      data.description ?? null,
      data.image_url ?? null,
    ];

    const { rows } = await pool.query<RamModel>(query, values);
    return rows[0];
  }

  async update(id: number, data: Partial<RamModel>): Promise<RamModel | null> {
    const query = `
      UPDATE public.ram_models
      SET 
        manufacturer_id = COALESCE($1, manufacturer_id),
        type_id = COALESCE($2, type_id),
        form_factor_id = COALESCE($3, form_factor_id),
        model_name = COALESCE($4, model_name),
        capacity_gb = COALESCE($5, capacity_gb),
        frequency_mhz = COALESCE($6, frequency_mhz),
        cas_latency = COALESCE($7, cas_latency),
        extra_features = COALESCE($8::jsonb, extra_features),
        description = COALESCE($9, description),
        image_url = COALESCE($10, image_url)
      WHERE ram_id = $11
      RETURNING *;
    `;

    const values = [
      data.manufacturer_id ?? null,
      data.type_id ?? null,
      data.form_factor_id ?? null,
      data.model_name ?? null,
      data.capacity_gb ?? null,
      data.frequency_mhz ?? null,
      data.cas_latency ?? null,
      data.extra_features ? JSON.stringify(data.extra_features) : null,
      data.description ?? null,
      data.image_url ?? null,
      id,
    ];

    const { rows } = await pool.query<RamModel>(query, values);
    return rows[0] || null;
  }

  async delete(id: number): Promise<boolean> {
    const query = `DELETE FROM public.ram_models WHERE ram_id = $1;`;
    const result = await pool.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  }
}


