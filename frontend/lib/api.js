const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

export async function apiRequest(path, { method = "GET", token, data } = {}) {
  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : { detail: "Unexpected response from server." };

  if (!response.ok) {
    const fieldError = Object.values(payload).find((value) => Array.isArray(value) && value.length);
    const message =
      payload.detail ||
      payload.non_field_errors?.[0] ||
      fieldError?.[0] ||
      payload.password?.[0] ||
      payload.username?.[0] ||
      "Request failed.";
    throw new Error(message);
  }

  return payload;
}

export { API_BASE_URL };
