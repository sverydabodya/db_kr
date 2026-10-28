import { Router } from "express";
import { ManufacturerRepository } from "../repositories/manufacturerRepository";
import { ManufacturerController } from "../controllers/manufacturerController";
import { authenticateJWT } from "../middlewares/authMiddleware";

const ManufacturerRouter: Router = Router();
const manRepo = new ManufacturerRepository();
const manController = new ManufacturerController(manRepo);

ManufacturerRouter.get("/", manController.getAll);
ManufacturerRouter.get("/:id", manController.getById);

ManufacturerRouter.use(authenticateJWT);

ManufacturerRouter.post("/", manController.create);

ManufacturerRouter.put("/:id", manController.update);

ManufacturerRouter.delete("/:id", manController.delete);

export default ManufacturerRouter;
