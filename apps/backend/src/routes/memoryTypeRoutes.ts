import { Router } from "express";
import { MemoryTypeController } from "../controllers/memoryTypeController";
import { MemoryTypeRepository } from "../repositories/memoryTypeRepository";

const MemoryTypeRouter: Router = Router();
const memoryTypeRepo = new MemoryTypeRepository();
const memoryTypeController = new MemoryTypeController(memoryTypeRepo);

MemoryTypeRouter.get("/", memoryTypeController.getAll);
MemoryTypeRouter.get("/:id", memoryTypeController.getById);
MemoryTypeRouter.post("/", memoryTypeController.create);
MemoryTypeRouter.put("/:id", memoryTypeController.update);
MemoryTypeRouter.delete("/:id", memoryTypeController.delete);

export default MemoryTypeRouter;
