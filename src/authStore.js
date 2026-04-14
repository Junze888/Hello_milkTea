/**
 * 对接 Go 后端：持久化 access / refresh token 与用户信息（仅非 mock 模式使用）
 */
const KEY = "hello_milktea_auth_v2";

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function save(session) {
  localStorage.setItem(KEY, JSON.stringify(session));
}

export function clear() {
  localStorage.removeItem(KEY);
}

export function getAccessToken() {
  const s = load();
  return s?.accessToken ?? null;
}

export function getRefreshToken() {
  const s = load();
  return s?.refreshToken ?? null;
}

export function getUser() {
  const s = load();
  return s?.user ?? null;
}
