import "dotenv/config";
import { createClient } from "redis";
import fs from "fs";
import path from "path";
import Docker from "dockerode";
import { prisma } from "db";

const client = createClient({ url: process.env.REDIS_URL });
const docker = new Docker(
  process.platform === "win32"
    ? { socketPath: "//./pipe/docker_engine" }
    : { socketPath: "/var/run/docker.sock" }
);

const codeDir = path.join(process.cwd(), "code");
fs.mkdirSync(codeDir, { recursive: true });

const TIMEOUT_MS = 10_000;
const MEMORY_LIMIT_BYTES = 256 * 1024 * 1024;
const PIDS_LIMIT = 64;

type LangConfig = {
  image: string;
  filename: string;
  cmd: (filename: string) => string[];
};

const LANGUAGE_CONFIG: Record<string, LangConfig> = {
  js: {
    image: "judge-js-runner",
    filename: "main.js",
    cmd: (f) => ["node", `/box/${f}`],
  },
  py: {
    image: "judge-py-runner",
    filename: "main.py",
    cmd: (f) => ["python3", `/box/${f}`],
  },
  java: {
    image: "judge-java-runner",
    filename: "Main.java",
    cmd: () => [
      "sh", "-c",
      "cp /box/Main.java /tmp/Main.java && cd /tmp && javac Main.java && java Main",
    ],
  },
  cpp: {
    image: "judge-cpp-runner",
    filename: "main.cpp",
    cmd: () => [
      "sh", "-c",
      "cp /box/main.cpp /tmp/main.cpp && cd /tmp && g++ main.cpp -o app && ./app",
    ],
  },
};

type SandboxResult = { success: boolean; output: string };

async function runInSandbox(
  language: string,
  code: string,
  submissionId: string
): Promise<SandboxResult> {
  const config = LANGUAGE_CONFIG[language];
  if (!config) {
    return { success: false, output: `Unsupported language: ${language}` };
  }

  const hostDir = path.join(codeDir, submissionId);
  fs.mkdirSync(hostDir, { recursive: true });
  fs.writeFileSync(path.join(hostDir, config.filename), code);
  fs.chmodSync(hostDir, 0o777);

  let container: Docker.Container | undefined;

  try {
    container = await docker.createContainer({
      Image: config.image,
      Cmd: config.cmd(config.filename),
      Tty: true,
      HostConfig: {
        Binds: [`${hostDir}:/box`],
        NetworkMode: "none",
        Memory: MEMORY_LIMIT_BYTES,
        PidsLimit: PIDS_LIMIT,
        CapDrop: ["ALL"],
        SecurityOpt: ["no-new-privileges"],
        AutoRemove: false,
      },
    });

    await container.start();

    const waitPromise = container.wait().catch(() => ({ StatusCode: -1 }));
    const timeoutPromise = new Promise<"timeout">((resolve) =>
      setTimeout(() => resolve("timeout"), TIMEOUT_MS)
    );

    const result = await Promise.race([waitPromise, timeoutPromise]);
    const timedOut = result === "timeout";

    if (timedOut) {
      await container.kill().catch(() => {});
    }

    const logsBuffer = await container.logs({ stdout: true, stderr: true }).catch(() => Buffer.from(""));
    const output = logsBuffer.toString();

    if (timedOut) {
      return { success: false, output: output + "\n\n[Time Limit Exceeded]" };
    }

    const statusCode = (result as { StatusCode: number }).StatusCode;
    return { success: statusCode === 0, output };
  } finally {
    if (container) {
      await container.remove({ force: true }).catch(() => {});
    }
    fs.rmSync(hostDir, { recursive: true, force: true });
  }
}

client.connect().then(async () => {
  console.log("Worker connected to Redis, waiting for jobs...");
  while (true) {
    const response = await client.rPop("problems");
    if (!response) {
      await new Promise((r) => setTimeout(r, 1000));
      continue;
    }

    const { code, language, submissionId } = JSON.parse(response);
    console.log(`Processing submission ${submissionId} (${language})`);

    try {
      const { success, output } = await runInSandbox(language, code, submissionId);
      await prisma.submission.update({
        where: { id: submissionId },
        data: { status: success ? "Success" : "Failure", output },
      });
    } catch (err) {
      console.error("Sandbox execution failed:", err);
      await prisma.submission.update({
        where: { id: submissionId },
        data: { status: "Failure", output: String(err) },
      });
    }
  }
});