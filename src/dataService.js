import * as api from "./api.js";
import * as mock from "./mockStore.js";

export async function listTeas() {
  if (api.USE_MOCK) return mock.listTeas();
  const data = await api.apiListTeas();
  return data.teas ?? data;
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
  return api.apiSubmitReview(teaId, payload);
}

export async function login(username, password) {
  if (api.USE_MOCK) {
    const user = mock.ensureUser(username);
    mock.setSession(user);
    return { user };
  }
  return api.apiLogin({ username, password });
}

export function logout() {
  mock.setSession(null);
}

export function getSession() {
  return mock.getSession();
}
