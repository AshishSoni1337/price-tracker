import express from "express";
import { getHealthStatus } from "../controllers/healthController.js";

const router = express.Router();

router.get("/health", getHealthStatus);

export default router;
