import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api, ApiError, type SubmissionSummary } from "../lib/api";

const STATUS_STYLES: Record<SubmissionSummary["status"], string> = {
  Pending: "bg-amber-500/10 text-amber-400",
  Success: "bg-emerald-500/10 text-emerald-400",
  Failure: "bg-red-500/10 text-red-400",
};

const LANGUAGE_LABELS: Record<SubmissionSummary["language"], string> = {
  js: "JavaScript",
  py: "Python",
  java: "Java",
  cpp: "C++",
};

export function Submissions() {
  const { token } = useAuth();
  const [submissions, setSubmissions] = useState<SubmissionSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    api
      .listSubmissions(token)
      .then(setSubmissions)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load submissions"))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="flex-1 overflow-auto px-6 py-8">
      <h1 className="mb-6 text-xl font-semibold text-white">Your submissions</h1>

      {error && (
        <div className="mb-4 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</div>
      )}

      {loading ? (
        <p className="text-slate-400">Loading...</p>
      ) : submissions.length === 0 ? (
        <p className="text-slate-400">
          No submissions yet. Head to the{" "}
          <Link to="/editor" className="text-emerald-400 hover:underline">
            editor
          </Link>{" "}
          to run some code.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900 text-slate-400">
              <tr>
                <th className="px-4 py-2 font-medium">Language</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {submissions.map((s) => (
                <tr key={s.id} className="bg-slate-950 hover:bg-slate-900">
                  <td className="px-4 py-2">
                    <Link to={`/submissions/${s.id}`} className="block text-slate-200 hover:text-emerald-400">
                      {LANGUAGE_LABELS[s.language]}
                    </Link>
                  </td>
                  <td className="px-4 py-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[s.status]}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-slate-400">{new Date(s.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
