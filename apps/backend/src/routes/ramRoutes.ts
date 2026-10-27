import { Router } from "express";
import { RamController } from "../controllers/ramController";
import { RamRepository } from "../repositories/ramRepository";

const RamRouter: Router = Router();
const ramRepo = new RamRepository();
const ramController = new RamController(ramRepo);

RamRouter.get("/", ramController.getAll);
RamRouter.get("/:id", ramController.getById);

RamRouter.post("/", ramController.create);

RamRouter.put("/:id", ramController.update);

RamRouter.delete("/:id", ramController.delete);

export default RamRouter;
