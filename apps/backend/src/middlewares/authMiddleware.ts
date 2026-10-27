import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticateJWT = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];

    const secret = process.env.JWT_SECRET || "default_secret";

    jwt.verify(token, secret, (err, decoded) => {
      if (err) {
        res
          .status(403)
          .json({ error: "Недійсний або прострочений токен доступу" });
        return;
      }

      req.user = decoded;

      next();
    });
  } else {
    res
      .status(401)
      .json({ error: "Токен автентифікації відсутній. Доступ заборонено." });
    return;
  }
};
