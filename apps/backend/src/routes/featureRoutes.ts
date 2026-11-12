import { Router } from "express";
import {
  getFeatureDefinitions,
  createFeatureDefinition,
  updateFeatureDefinition,
  deleteFeatureDefinition,
} from "../controllers/featuresController";
import { authenticateJWT } from "../middlewares/authMiddleware";

const FeatureRouter = Router();

FeatureRouter.get("/", getFeatureDefinitions);
FeatureRouter.use(authenticateJWT);
FeatureRouter.post("/", createFeatureDefinition);
FeatureRouter.put("/:id", updateFeatureDefinition);
FeatureRouter.delete("/:id", deleteFeatureDefinition);

export default FeatureRouter;
