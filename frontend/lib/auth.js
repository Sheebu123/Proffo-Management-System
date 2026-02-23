const ACCESS_TOKEN_KEY = "smartsalon_access_token";
const REFRESH_TOKEN_KEY = "smartsalon_refresh_token";
const USER_KEY = "smartsalon_user";

export function getAccessToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setAuth(accessToken, refreshToken, user) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) {
    window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getStoredUser() {
  if (typeof window === "undefined") return null;
  const user = window.localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
}

export function clearAuth() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}
