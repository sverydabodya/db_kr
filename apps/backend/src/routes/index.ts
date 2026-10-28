import { Router } from "express";
import RamRouter from "./ramRoutes";
import ManufacturerRouter from "./manufacturerRoutes";
import MemoryTypeRouter from "./memoryTypeRoutes";
import FormFactorRouter from "./formFactorRoutes";
import AuthRouter from "./authRoutes";
import * as UploadController from "../controllers/uploadController";
import { authenticateJWT } from "../middlewares/authMiddleware";

const MainRouter: Router = Router();

MainRouter.use("/auth", AuthRouter);

MainRouter.use("/ram", RamRouter);
MainRouter.use("/manufacturers", ManufacturerRouter);
MainRouter.use("/memoryTypes", MemoryTypeRouter);
MainRouter.use("/formFactors", FormFactorRouter);

MainRouter.post(
  "/upload",
  authenticateJWT,
  UploadController.uploadImageMiddleware,
  UploadController.uploadImageController,
);

export default MainRouter;
