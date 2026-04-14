import * as api from "./api.js";
import * as authStore from "./authStore.js";
import * as mock from "./mockStore.js";

export function isMock() {
  return api.USE_MOCK;
}

/** 将后端单品转为界面统一结构 */
export function normalizeTea(t) {
  return {
    id: t.id,
    name: t.name,
    shop: t.shop_name || "",
    tags: Array.isArray(t.tags) ? t.tags : [],
    avg_rating: typeof t.avg_rating === "number" ? t.avg_rating : 0,
    review_count: Number(t.review_count || 0),
    ratings: [],
  };
}

function mapReview(r) {
  return {
    userName: r.user_name || "",
    userId: String(r.user_id),
    stars: r.stars,
    comment: r.comment || "",
    ts: r.created_at ? Date.parse(r.created_at) : Date.now(),
  };
}

export async function bootstrap() {
  if (api.USE_MOCK) return;
  const s = authStore.load();
  if (!s?.accessToken || !s?.user) return;
  try {
    const me = await api.apiMe();
    authStore.save({
      ...s,
      user: {
        id: me.id,
        username: me.username,
        nickname: me.nickname,
        avatar_url: me.avatar_url,
      },
    });
  } catch {
    authStore.clear();
  }
}

export async function listTeas() {
  if (api.USE_MOCK) return mock.listTeas();
  const data = await api.apiListTeas({ page: 1, page_size: 100 });
  const items = data.items || data.teas || [];
  return items.map(normalizeTea);
}

export async function fetchLeaderboard(limit = 50) {
  if (api.USE_MOCK) {
    const teas = mock.listTeas();
    return mock.leaderboard(teas).map((row, i) => ({
      rank: i + 1,
      tea: row.tea,
      avg: row.avg,
      count: row.count,
    }));
  }
  const data = await api.apiLeaderboard(limit);
  const items = data.items || [];
  return items.map((r) => ({
    rank: r.rank,
    tea: { name: r.name, shop: r.shop_name, tags: [] },
    avg: r.avg_rating,
    count: r.review_count,
  }));
}

export async function loadReviewsForTea(teaId) {
  if (api.USE_MOCK) return;
  const data = await api.apiListTeaReviews(teaId, { page: 1, page_size: 100 });
  const items = data.items || [];
  return items.map(mapReview);
}

export async function submitReview(teaId, payload) {
  if (api.USE_MOCK) {
    const session = mock.getSession();
    if (!session) throw new Error("请先登录");
    return mock.addReview(teaId, {
      userId: session.id,
      userName: session.name,
      stars: payload.stars,
      comment: payload.comment,
    });
  }
  await api.apiSubmitReview(teaId, {
    stars: payload.stars,
    title: "",
    comment: payload.comment || "",
  });
}

export async function login(username, password) {
  if (api.USE_MOCK) {
    const user = mock.ensureUser(username);
    mock.setSession(user);
    return { user };
  }
  const data = await api.apiLogin({ username, password });
  authStore.save({
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    user: data.user,
  });
  return data;
}

export async function register({ username, email, password, nickname }) {
  if (api.USE_MOCK) {
    const u = mock.ensureUser(username);
    mock.setSession({ id: u.id, name: nickname || username });
    return { ok: true };
  }
  await api.apiRegister({
    username,
    email,
    password,
    nickname: nickname || username,
  });
}

export async function logout() {
  if (api.USE_MOCK) {
    mock.setSession(null);
    return;
  }
  await api.apiLogout();
  authStore.clear();
}

export function getSession() {
  if (api.USE_MOCK) return mock.getSession();
  const u = authStore.getUser();
  if (!u) return null;
  return {
    id: u.id,
    name: u.nickname || u.username || "",
    username: u.username,
  };
}
