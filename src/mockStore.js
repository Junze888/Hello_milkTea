/**
 * 初版：浏览器 localStorage 模拟数据；与后端字段对齐，便于迁移。
 */

const KEY = "hello_milktea_v1";

const seedTeas = () => [
  {
    id: "t1",
    name: "芝芝莓莓",
    shop: "喜茶",
    tags: ["芝士", "草莓"],
    ratings: [
      { userId: "demo", stars: 5, comment: "奶盖很厚，草莓季必点。", ts: Date.now() - 86400000 },
    ],
  },
  {
    id: "t2",
    name: "杨枝甘露",
    shop: "七分甜",
    tags: ["芒果", "椰奶"],
    ratings: [
      { userId: "demo", stars: 4, comment: "料足，略甜。", ts: Date.now() - 3600000 },
      { userId: "u2", stars: 5, comment: "", ts: Date.now() - 7200000 },
    ],
  },
  {
    id: "t3",
    name: "珍珠奶茶",
    shop: "一点点",
    tags: ["经典", "珍珠"],
    ratings: [{ userId: "u3", stars: 3, comment: "中规中矩。", ts: Date.now() - 100000 }],
  },
];

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return {
    teas: seedTeas(),
    session: null,
  };
}

function save(state) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function getState() {
  return load();
}

export function setSession(user) {
  const s = load();
  s.session = user ? { id: user.id, name: user.name } : null;
  save(s);
  return s.session;
}

export function getSession() {
  return load().session;
}

export function listTeas() {
  return load().teas;
}

export function addReview(teaId, { userId, userName, stars, comment }) {
  const s = load();
  const tea = s.teas.find((t) => t.id === teaId);
  if (!tea) throw new Error("奶茶不存在");
  tea.ratings = tea.ratings || [];
  tea.ratings.push({
    userId,
    userName,
    stars,
    comment: (comment || "").trim(),
    ts: Date.now(),
  });
  save(s);
  return tea;
}

export function ensureUser(username) {
  const name = (username || "").trim();
  if (!name) throw new Error("请输入昵称");
  const id = "u_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  return { id, name };
}

export function statsForTea(tea) {
  const ratings = tea.ratings || [];
  const n = ratings.length;
  if (n === 0) return { avg: 0, count: 0 };
  const sum = ratings.reduce((a, r) => a + r.stars, 0);
  return { avg: sum / n, count: n };
}

export function leaderboard(teas) {
  return [...teas]
    .map((t) => {
      const { avg, count } = statsForTea(t);
      return { tea: t, avg, count };
    })
    .filter((x) => x.count > 0)
    .sort((a, b) => b.avg - a.avg || b.count - a.count);
}
