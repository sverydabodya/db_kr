import { Router } from "express";
import { AuthController } from "../controllers/authController";
import { UserRepository } from "../repositories/userRepository";

const AuthRouter: Router = Router();
const userRepo = new UserRepository();
const authController = new AuthController(userRepo);

AuthRouter.post("/register", authController.register);
AuthRouter.post("/login", authController.login);

export default AuthRouter;
