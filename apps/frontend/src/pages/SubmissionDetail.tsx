import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CodeEditor } from "../components/CodeEditor";
import { useAuth } from "../context/AuthContext";
import { api, ApiError, type Submission } from "../lib/api";

export function SubmissionDetail() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [review, setReview] = useState<string | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !id) return;
    api
      .getSubmission(token, id)
      .then((s) => {
        setSubmission(s);
        setReview(s.aiReview ?? null);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load submission"));
  }, [token, id]);

  async function handleReview() {
    if (!token || !id) return;
    setReviewLoading(true);
    setReviewError(null);
    try {
      const { review } = await api.reviewSubmission(token, id);
      setReview(review);
    } catch (err) {
      setReviewError(err instanceof ApiError ? err.message : "Failed to get AI review");
    } finally {
      setReviewLoading(false);
    }
  }

  if (error) {
    return (
      <div className="flex-1 px-6 py-8">
        <div className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="flex-1 px-6 py-8">
        <p className="text-slate-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-6 py-3">
        <Link to="/submissions" className="text-sm text-emerald-400 hover:underline">
          &larr; Back to submissions
        </Link>
        <span className="text-sm font-medium text-slate-300">{submission.status}</span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-1/2 border-r border-slate-800">
          <CodeEditor language={submission.language} value={submission.code} onChange={() => {}} readOnly />
        </div>

        <div className="flex w-1/2 flex-col bg-slate-950">
          <div className="border-b border-slate-800 px-4 py-2">
            <span className="text-sm font-medium text-slate-300">Output</span>
          </div>
          <div className="max-h-[50%] flex-1 overflow-auto p-4">
            <pre className="whitespace-pre-wrap text-sm text-slate-200">{submission.output || "—"}</pre>
          </div>

          <div className="flex items-center justify-between border-y border-slate-800 px-4 py-2">
            <span className="text-sm font-medium text-slate-300">AI Review</span>
            <button
              onClick={handleReview}
              disabled={reviewLoading}
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
                {reviewLoading ? "Asking the assistant to review your code..." : "No review yet. Click \"Get AI Review\" for feedback on your code."}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
