import { supabase } from "../lib/supabaseClient";
export async function request(
  path: string,
  method = "GET",
  data?: unknown,
  blob = false,
) {
  const session = supabase
    ? (await supabase.auth.getSession()).data.session
    : null;
  const response = await fetch(
    `${import.meta.env.VITE_EDUCATION_API_URL || ""}/api/education/${path}`,
    {
      method,
      signal: AbortSignal.timeout(path === "editor/import" ? 90000 : 20000),
      headers: {
        ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
        ...(data ? { "Content-Type": "application/json" } : {}),
      },
      body: data ? JSON.stringify(data) : undefined,
    },
  );
  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Education server unavailable" }));
    throw new Error(error.error || `Request failed (${response.status})`);
  }
  return blob ? response.blob() : response.json();
}
