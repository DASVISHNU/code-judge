import {Router} from "express";
import {requireAuth} from "../middleware/auth.middleware.ts"
import { createSubmission,getSubmission } from "../controllers/submission.controller.ts";
import { reviewSubmission } from "../controllers/assistant.conrtroller";
import { reviewRateLimit } from "../middleware/rateLimit.middleware.ts";

const router=Router();

router.post("/",requireAuth,createSubmission);
router.get("/:id",requireAuth,getSubmission);
router.post("/:id/review",requireAuth,reviewRateLimit,reviewSubmission);


export default router;
