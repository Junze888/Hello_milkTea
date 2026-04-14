/**
 * milk_tea_go 后端 API（/api/v1）
 * 开发：VITE_API_BASE 留空 + Vite 代理 /api -> http://127.0.0.1:8080
 */
import * as authStore from "./authStore.js";

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== "false";
const API_BASE = (import.meta.env.VITE_API_BASE || "").replace(/\/$/, "");

function joinURL(path) {
  if (!path.startsWith("/")) path = `/${path}`;
  if (API_BASE) return `${API_BASE}${path}`;
  return path;
}

async function parseError(res) {
  const text = await res.text();
  try {
    const j = JSON.parse(text);
    return j.error || j.message || text || `HTTP ${res.status}`;
  } catch {
    return text || `HTTP ${res.status}`;
  }
}

let refreshPromise = null;

async function refreshAccessToken() {
  const rt = authStore.getRefreshToken();
  if (!rt) throw new Error("未登录或登录已过期");
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    const res = await fetch(joinURL("/api/v1/auth/refresh"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: rt }),
    });
    if (!res.ok) {
      authStore.clear();
      throw new Error(await parseError(res));
    }
    const data = await res.json();
    const prev = authStore.load() || {};
    authStore.save({
      ...prev,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      user: prev.user,
    });
    return data.access_token;
  })();
  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

/**
 * @param {string} path
 * @param {RequestInit} options
 * @param {{ retry?: boolean }} meta
 */
export async function request(path, options = {}, meta = {}) {
  const headers = { ...(options.headers || {}) };
  const isForm = options.body instanceof FormData;
  if (!isForm && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const token = authStore.getAccessToken();
  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  const url = joinURL(path);
  let res = await fetch(url, { ...options, headers });

  if (res.status === 401 && meta.retry !== false && token) {
    try {
      const newTok = await refreshAccessToken();
      headers.Authorization = `Bearer ${newTok}`;
      res = await fetch(url, { ...options, headers });
    } catch {
      throw new Error("登录已过期，请重新登录");
    }
  }

  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  const ct = res.headers.get("content-type");
  if (ct && ct.includes("application/json")) return res.json();
  return res.text();
}

export async function apiRegister(body) {
  return request("/api/v1/auth/register", { method: "POST", body: JSON.stringify(body) }, { retry: false });
}

export async function apiLogin(body) {
  return request("/api/v1/auth/login", { method: "POST", body: JSON.stringify(body) }, { retry: false });
}

export async function apiLogout() {
  const rt = authStore.getRefreshToken();
  if (!rt) return;
  try {
    await request(
      "/api/v1/auth/logout",
      { method: "POST", body: JSON.stringify({ refresh_token: rt }) },
      { retry: false }
    );
  } catch {
    /* ignore */
  }
}

export async function apiListTeas(params = {}) {
  const q = new URLSearchParams();
  if (params.page) q.set("page", String(params.page));
  if (params.page_size) q.set("page_size", String(params.page_size));
  if (params.category_id) q.set("category_id", String(params.category_id));
  const qs = q.toString();
  return request(`/api/v1/teas${qs ? `?${qs}` : ""}`, { method: "GET" }, { retry: true });
}

export async function apiGetTea(id) {
  return request(`/api/v1/teas/${encodeURIComponent(id)}`, { method: "GET" }, { retry: true });
}

export async function apiListTeaReviews(teaId, params = {}) {
  const q = new URLSearchParams();
  if (params.page) q.set("page", String(params.page));
  if (params.page_size) q.set("page_size", String(params.page_size));
  const qs = q.toString();
  return request(`/api/v1/teas/${encodeURIComponent(teaId)}/reviews${qs ? `?${qs}` : ""}`, { method: "GET" }, { retry: true });
}

export async function apiLeaderboard(limit = 50) {
  return request(`/api/v1/leaderboard?limit=${encodeURIComponent(limit)}`, { method: "GET" }, { retry: true });
}

export async function apiSubmitReview(teaId, body) {
  return request(`/api/v1/teas/${encodeURIComponent(teaId)}/reviews`, { method: "POST", body: JSON.stringify(body) }, { retry: true });
}

export async function apiMe() {
  return request("/api/v1/me", { method: "GET" }, { retry: true });
}

export { USE_MOCK, API_BASE };
