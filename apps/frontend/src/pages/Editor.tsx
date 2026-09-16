import { useEffect, useRef, useState } from "react";
import { CodeEditor } from "../components/CodeEditor";
import { useAuth } from "../context/AuthContext";
import { api, ApiError, type Language, type SubmissionStatus } from "../lib/api";

const LANGUAGES: { value: Language; label: string }[] = [
  { value: "js", label: "JavaScript" },
  { value: "py", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
];

const STARTER_CODE: Record<Language, string> = {
  js: 'console.log("Hello, world!");\n',
  py: 'print("Hello, world!")\n',
  java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, world!");\n    }\n}\n',
  cpp: '#include <iostream>\n\nint main() {\n    std::cout << "Hello, world!" << std::endl;\n    return 0;\n}\n',
};

const POLL_INTERVAL_MS = 1500;

export function Editor() {
  const { token } = useAuth();
  const [language, setLanguage] = useState<Language>("js");
  const [code, setCode] = useState(STARTER_CODE.js);
  const [status, setStatus] = useState<SubmissionStatus | "Idle">("Idle");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [review, setReview] = useState<string | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  function handleLanguageChange(next: Language) {
    setLanguage(next);
    setCode(STARTER_CODE[next]);
  }

  async function handleSubmit() {
    if (!token) return;
    if (pollRef.current) clearInterval(pollRef.current);

    setError(null);
    setOutput("");
    setStatus("Pending");
    setSubmissionId(null);
    setReview(null);
    setReviewError(null);

    try {
      const { id } = await api.createSubmission(token, code, language);
      setSubmissionId(id);

      pollRef.current = setInterval(async () => {
        try {
          const submission = await api.getSubmission(token, id);
          setStatus(submission.status);
          if (submission.status !== "Pending") {
            setOutput(submission.output ?? "");
            if (pollRef.current) clearInterval(pollRef.current);
          }
        } catch (err) {
          if (pollRef.current) clearInterval(pollRef.current);
          setError(err instanceof ApiError ? err.message : "Failed to fetch result");
          setStatus("Idle");
        }
      }, POLL_INTERVAL_MS);
    } catch (err) {
      setStatus("Idle");
      setError(err instanceof ApiError ? err.message : "Failed to submit code");
    }
  }

  const isRunning = status === "Pending";

  async function handleReview() {
    if (!token || !submissionId) return;
    setReviewLoading(true);
    setReviewError(null);
    try {
      const { review } = await api.reviewSubmission(token, submissionId);
      setReview(review);
    } catch (err) {
      setReviewError(err instanceof ApiError ? err.message : "Failed to get AI review");
    } finally {
      setReviewLoading(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-4 border-b border-slate-800 bg-slate-900 px-6 py-3">
        <select
          value={language}
          onChange={(e) => handleLanguageChange(e.target.value as Language)}
          className="rounded-md border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-white outline-none focus:border-emerald-500"
        >
          {LANGUAGES.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>

        <button
          onClick={handleSubmit}
          disabled={isRunning}
          className="rounded-md bg-emerald-500 px-4 py-1.5 text-sm font-medium text-slate-950 transition-colors hover:bg-emerald-400 disabled:opacity-50"
        >
          {isRunning ? "Running..." : "Run"}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-1/2 border-r border-slate-800">
          <CodeEditor language={language} value={code} onChange={setCode} />
        </div>

        <div className="flex w-1/2 flex-col bg-slate-950">
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2">
            <span className="text-sm font-medium text-slate-300">Output</span>
            <StatusBadge status={status} />
          </div>
          <div className="max-h-[50%] flex-1 overflow-auto p-4">
            {error ? (
              <pre className="whitespace-pre-wrap text-sm text-red-400">{error}</pre>
            ) : (
              <pre className="whitespace-pre-wrap text-sm text-slate-200">
                {output || (isRunning ? "Waiting for result..." : "Run your code to see output here.")}
              </pre>
            )}
          </div>

          <div className="flex items-center justify-between border-y border-slate-800 px-4 py-2">
            <span className="text-sm font-medium text-slate-300">AI Review</span>
            <button
              onClick={handleReview}
              disabled={!submissionId || isRunning || reviewLoading}
              className="rounded-md bg-emerald-500 px-3 py-1 text-xs font-medium text-slate-950 transition-colors hover:bg-emerald-400 disabled:opacity-50"
            >
              {reviewLoading ? "Reviewing..." : review ? "Regenerate" : "Get AI Review"}
            </button>
          </div>
          <div className="flex-1 overflow-auto p-4">
            {reviewError ? (
              <p className="text-sm text-red-400">{reviewError}</p>
            ) : review ? (
              <p className="whitespace-pre-wrap text-sm text-slate-200">{review}</p>
            ) : (
              <p className="text-sm text-slate-500">
                {reviewLoading
                  ? "Asking the assistant to review your code..."
                  : submissionId
                  ? "Click \"Get AI Review\" for feedback on your code."
                  : "Run your code first to get an AI review."}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: SubmissionStatus | "Idle" }) {
  const styles: Record<SubmissionStatus | "Idle", string> = {
    Idle: "bg-slate-800 text-slate-400",
    Pending: "bg-amber-500/10 text-amber-400",
    Success: "bg-emerald-500/10 text-emerald-400",
    Failure: "bg-red-500/10 text-red-400",
  };

  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}>{status}</span>
  );
}
