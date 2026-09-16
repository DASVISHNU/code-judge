import "dotenv/config";
import express from "express";
import cors from "cors";
import { prisma } from "db";
import authRoutes from "./routes/auth.route.ts";
import submissionRoutes from "./routes/submission.routes.ts";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/submission", submissionRoutes);

app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", database: "connected" });
  } catch (err) {
    res.status(500).json({ status: "error", message: String(err) });
  }
});

const port = process.env.PORT ?? 3000;
app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});