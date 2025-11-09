import { Router } from "express";
import { getStatistics } from "../controllers/statisticsController";

const router = Router();

// Ruta pública para obtener estadísticas del marketplace
router.get("/", getStatistics);

export default router;
