import {
  clearAuth,
  getRefreshToken,
  setTokens,
} from "@/lib/auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://127.0.0.1:8000";

const DEFAULT_TIMEOUT_MS = Number(process.env.NEXT_PUBLIC_API_TIMEOUT_MS || 15000);
const AUTH_EXCLUDED_PATHS = new Set([
  "/api/accounts/login/",
  "/api/accounts/register/",
  "/api/accounts/token/refresh/",
  "/api/accounts/logout/",
]);

let refreshRequest = null;

export class ApiError extends Error {
  constructor(message, { status = 0, payload = null } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

export function isAuthError(error) {
  return error instanceof ApiError && (error.status === 401 || error.status === 403);
}

export function isAbortError(error) {
  return error?.name === "AbortError";
}

function connectAbortSignals(externalSignal, controller) {
  if (!externalSignal) {
    return () => {};
  }

  const abortWithExternalSignal = () => controller.abort();

  if (externalSignal.aborted) {
    controller.abort();
    return () => {};
  }

  externalSignal.addEventListener("abort", abortWithExternalSignal, { once: true });
  return () => externalSignal.removeEventListener("abort", abortWithExternalSignal);
}

async function parsePayload(response) {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return null;
  }

  try {
    return await response.json();
  } catch (_) {
    return null;
  }
}

function getErrorMessage(payload, status) {
  if (status === 429) {
    return (
      payload?.detail ||
      "The server is handling too many requests right now. Please wait a moment and try again."
    );
  }

  const fieldError = payload
    ? Object.values(payload).find((value) => Array.isArray(value) && value.length)
    : null;

  return (
    payload?.detail ||
    payload?.non_field_errors?.[0] ||
    fieldError?.[0] ||
    payload?.password?.[0] ||
    payload?.username?.[0] ||
    "Request failed."
  );
}

async function requestJson(
  path,
  { method = "GET", token, data, signal, timeoutMs = DEFAULT_TIMEOUT_MS } = {}
) {
  const headers = {};
  if (data !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const disconnectAbortSignal = connectAbortSignals(signal, controller);
  let timedOut = false;
  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  try {
    let response;
    try {
      response = await fetch(`${API_BASE_URL}${path}`, {
        method,
        headers,
        body: data !== undefined ? JSON.stringify(data) : undefined,
        signal: controller.signal,
        cache: "no-store",
      });
    } catch (error) {
      if (timedOut) {
        throw new ApiError("The request timed out. Please try again.", { status: 408 });
      }
      throw error;
    }

    const payload = await parsePayload(response);

    if (!response.ok) {
      throw new ApiError(getErrorMessage(payload, response.status), {
        status: response.status,
        payload,
      });
    }

    return payload;
  } finally {
    clearTimeout(timeoutId);
    disconnectAbortSignal();
  }
}

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new ApiError("Your session has expired. Please log in again.", { status: 401 });
  }

  if (!refreshRequest) {
    refreshRequest = requestJson("/api/accounts/token/refresh/", {
      method: "POST",
      data: { refresh: refreshToken },
    })
      .then((payload) => {
        setTokens(payload?.access, payload?.refresh || refreshToken);
        return payload?.access;
      })
      .catch((error) => {
        if (isAuthError(error)) {
          clearAuth();
        }
        throw error;
      })
      .finally(() => {
        refreshRequest = null;
      });
  }

  return refreshRequest;
}

export async function apiRequest(
  path,
  { retryOnAuthFailure = true, token, ...options } = {}
) {
  try {
    return await requestJson(path, { token, ...options });
  } catch (error) {
    if (
      !retryOnAuthFailure ||
      !(error instanceof ApiError) ||
      error.status !== 401 ||
      !token ||
      AUTH_EXCLUDED_PATHS.has(path)
    ) {
      throw error;
    }

    const refreshedToken = await refreshAccessToken();
    return requestJson(path, {
      token: refreshedToken,
      ...options,
    });
  }
}

export { API_BASE_URL };
