import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { UserRepository } from "../repositories/userRepository";

export class AuthController {
  private userRepo: UserRepository;

  constructor(userRepo: UserRepository) {
    this.userRepo = userRepo;
  }

  register = async (req: Request, res: Response) => {
    try {
      const { login, password } = req.body;

      if (!login || !password) {
        res.status(400).json({ error: "Логін та пароль є обов'язковими" });
        return;
      }

      const existingUser = await this.userRepo.findByLogin(login);
      if (existingUser) {
        res.status(409).json({ error: "Користувач з таким логіном вже існує" });
        return;
      }

      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      const newUser = await this.userRepo.create({
        login,
        password_hash: passwordHash,
      });

      const secret = process.env.JWT_SECRET || "default_secret";
      const token = jwt.sign(
        { userId: newUser.user_id, login: newUser.login },
        secret,
        { expiresIn: "24h" },
      );

      res.status(201).json({
        message: "Користувача успішно створено",
        user: newUser,
        token,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  login = async (req: Request, res: Response) => {
    try {
      const { login, password } = req.body;

      if (!login || !password) {
        res.status(400).json({ error: "Логін та пароль є обов'язковими" });
        return;
      }

      const user = await this.userRepo.findByLogin(login);
      if (!user) {
        res.status(401).json({ error: "Невірний логін або пароль" });
        return;
      }

      const isPasswordValid = await bcrypt.compare(
        password,
        user.password_hash!,
      );
      if (!isPasswordValid) {
        res.status(401).json({ error: "Невірний логін або пароль" });
        return;
      }

      const secret = process.env.JWT_SECRET || "default_secret";
      const token = jwt.sign(
        { userId: user.user_id, login: user.login },
        secret,
        { expiresIn: "24h" },
      );

      res.status(200).json({
        message: "Успішний вхід",
        token,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };
}
