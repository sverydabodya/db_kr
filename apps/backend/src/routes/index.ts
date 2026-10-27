import { Router } from "express";
import RamRouter from "./ramRoutes";
import ManufacturerRouter from "./manufacturerRoutes";
import MemoryTypeRouter from "./memoryTypeRoutes";
import FormFactorRouter from "./formFactorRoutes";
import AuthRouter from "./authRoutes";

const MainRouter: Router = Router();

MainRouter.use("/auth", AuthRouter);

MainRouter.use("/ram", RamRouter);
MainRouter.use("/manufacturers", ManufacturerRouter);
MainRouter.use("/memoryTypes", MemoryTypeRouter);
MainRouter.use("/formFactors", FormFactorRouter);

export default MainRouter;
