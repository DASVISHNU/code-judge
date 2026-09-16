import type { Response } from "express";
import { createClient } from "redis";
import { z } from "zod";
import { prisma, Language } from "db";
import type { AuthRequest } from "../middleware/auth.middleware";

const redis = createClient({ url: process.env.REDIS_URL });
redis.connect();

const submissionSchema = z.object({
  code: z.string().min(1),
  language: z.enum(Language),
});

export async function createSubmission(req: AuthRequest, res: Response) {
  const parsed = submissionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { code, language } = parsed.data;

  const submission = await prisma.submission.create({
    data: {
      userId: req.userId!,
      code,
      language,
      status: "Pending",
    },
  });

  await redis.lPush(
    "problems",
    JSON.stringify({ submissionId: submission.id, code, language })
  );

  res.status(201).json({ id: submission.id, status: submission.status });
}

export async function getSubmission(req: AuthRequest, res: Response) {
  const submission = await prisma.submission.findUnique({
    where: { id: req.params.id as string },
  });

  if (!submission) {
    return res.status(404).json({ error: "Submission not found" });
  }

  if (submission.userId !== req.userId) {
    return res.status(403).json({ error: "Not your submission" });
  }

  res.json({
    id: submission.id,
    language: submission.language,
    code: submission.code,
    status: submission.status,
    output: submission.output,
    createdAt: submission.createdAt,
  });
}

export async function listSubmissions(req: AuthRequest, res: Response) {
  const submissions = await prisma.submission.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      language: true,
      status: true,
      createdAt: true,
    },
  });

  res.json(submissions);
}