/**
 * 后端 API 层（预留）
 * Go 服务就绪后：设置 VITE_API_BASE，并将 USE_MOCK 改为 false 或走环境变量切换。
 */

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== "false";
const API_BASE = (import.meta.env.VITE_API_BASE || "").replace(/\/$/, "");

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  const ct = res.headers.get("content-type");
  if (ct && ct.includes("application/json")) return res.json();
  return res.text();
}

/** GET /api/v1/teas */
export async function apiListTeas() {
  return request("/api/v1/teas", { method: "GET" });
}

/** POST /api/v1/teas/:id/reviews { stars, comment } */
export async function apiSubmitReview(teaId, body) {
  return request(`/api/v1/teas/${encodeURIComponent(teaId)}/reviews`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** POST /api/v1/auth/login { username, password } */
export async function apiLogin(body) {
  return request("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export { USE_MOCK, API_BASE };
