import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { createSubmission, getSubmission, listSubmissions } from "../controllers/submission.controller";
import { reviewSubmission } from "../controllers/assistant.conrtroller";
import { reviewRateLimit } from "../middleware/rateLimit.middleware";
const router = Router();

router.post("/", requireAuth, createSubmission);
router.get("/", requireAuth, listSubmissions);
router.get("/:id", requireAuth, getSubmission);
router.post("/:id/review", requireAuth, reviewRateLimit, reviewSubmission);
export default router;
