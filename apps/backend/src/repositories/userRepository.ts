import { pool } from "../config/db";
import { User } from "@ram-catalog/shared";

export class UserRepository {
  async findByLogin(login: string): Promise<User | null> {
    const query = `
      SELECT *
      FROM public.users
      WHERE login = $1;
    `;

    const { rows } = await pool.query<User>(query, [login]);
    return rows[0] || null;
  }

  async findById(id: number): Promise<User | null> {
    const query = `
      SELECT *
      FROM public.users
      WHERE user_id = $1;
    `;

    const { rows } = await pool.query<User>(query, [id]);
    return rows[0] || null;
  }

  async create(data: Omit<User, "user_id">): Promise<User> {
    const query = `
      INSERT INTO public.users (login, password_hash)
      VALUES ($1, $2)
      RETURNING user_id, login; -- Не повертаємо хеш пароля з міркувань безпеки
    `;

    const values = [data.login, data.password_hash];

    const { rows } = await pool.query<User>(query, values);
    return rows[0];
  }

  async update(id: number, data: Partial<User>): Promise<User | null> {
    const query = `
      UPDATE public.users
      SET 
        login = COALESCE($1, login),
        password_hash = COALESCE($2, password_hash)
      WHERE user_id = $3
      RETURNING user_id, login;
    `;

    const values = [data.login ?? null, data.password_hash ?? null, id];

    const { rows } = await pool.query<User>(query, values);
    return rows[0] || null;
  }

  async delete(id: number): Promise<boolean> {
    const query = `DELETE FROM public.users WHERE user_id = $1;`;
    const result = await pool.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  }
}
