export type Language = "js" | "py" | "java" | "cpp";
export type SubmissionStatus = "Pending" | "Success" | "Failure";

export type SubmissionSummary = {
  id: string;
  language: Language;
  status: SubmissionStatus;
  createdAt: string;
};

export type Submission = SubmissionSummary & {
  code: string;
  output: string | null;
  aiReview: string | null;
};

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      typeof data.error === "string" ? data.error : JSON.stringify(data.error ?? "Request failed");
    throw new ApiError(res.status, message);
  }

  return data as T;
}

export type AuthResponse = { token: string; user: { id: string; email: string } };

export const api = {
  register: (email: string, password: string, name?: string) =>
    request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    }),

  login: (email: string, password: string) =>
    request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  createSubmission: (token: string, code: string, language: Language) =>
    request<{ id: string; status: SubmissionStatus }>(
      "/submission",
      { method: "POST", body: JSON.stringify({ code, language }) },
      token
    ),

  getSubmission: (token: string, id: string) =>
    request<Submission>(`/submission/${id}`, {}, token),

  listSubmissions: (token: string) =>
    request<SubmissionSummary[]>("/submission", {}, token),

  reviewSubmission: (token: string, id: string) =>
    request<{ review: string }>(`/submission/${id}/review`, { method: "POST" }, token),
};

export { ApiError };
