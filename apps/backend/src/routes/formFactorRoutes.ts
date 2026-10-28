import { Router } from "express";
import { FormFactorController } from "../controllers/formFactorController";
import { FormFactorRepository } from "../repositories/formFactorRepository";
import { authenticateJWT } from "../middlewares/authMiddleware";

const FormFactorRouter: Router = Router();
const formFactorRepo = new FormFactorRepository();
const formFactorController = new FormFactorController(formFactorRepo);

FormFactorRouter.get("/", formFactorController.getAll);
FormFactorRouter.get("/:id", formFactorController.getById);

FormFactorRouter.use(authenticateJWT);

FormFactorRouter.post("/", formFactorController.create);
FormFactorRouter.put("/:id", formFactorController.update);
FormFactorRouter.delete("/:id", formFactorController.delete);

export default FormFactorRouter;
