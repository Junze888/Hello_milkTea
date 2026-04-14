import * as ds from "./dataService.js";
import * as api from "./api.js";
import * as mock from "./mockStore.js";

let selectedTeaId = null;
let loginOpen = false;
let loginMode = "login"; // login | register

const state = {
  loading: false,
  error: null,
  teas: [],
  board: [],
};

function starsHtml(n, max = 5) {
  const full = Math.round(n);
  let s = "";
  for (let i = 1; i <= max; i++) {
    s += `<span class="star ${i <= full ? "on" : ""}" aria-hidden="true">★</span>`;
  }
  return s;
}

function statsForTea(tea) {
  if (typeof tea.avg_rating === "number" && tea.review_count != null) {
    return { avg: tea.avg_rating, count: Number(tea.review_count) };
  }
  return mock.statsForTea(tea);
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function heroText() {
  if (api.USE_MOCK) {
    return "初版数据保存在本机浏览器；可在 .env 关闭 mock 对接 Go 后端。";
  }
  const base = api.API_BASE || "（同源 /api 代理）";
  return `已连接后端 <code>${escapeHtml(base)}</code> · Access Token 存于本机 localStorage。`;
}

function cardHtml(tea, open) {
  const { avg, count } = statsForTea(tea);
  const session = ds.getSession();
  const tid = String(tea.id);
  return `
    <article class="tea-card ${open ? "open" : ""}" data-id="${tid}">
      <button type="button" class="tea-head" data-toggle="${tid}">
        <div>
          <h4>${escapeHtml(tea.name)}</h4>
          <p class="shop">${escapeHtml(tea.shop)}</p>
        </div>
        <div class="tea-meta">
          <div class="avg">${count ? avg.toFixed(1) : "—"}</div>
          <div class="small">${count} 人打分</div>
        </div>
      </button>
      <div class="tea-body" ${open ? "" : "hidden"}>
        <div class="tags">${(tea.tags || []).map((x) => `<span class="tag">${escapeHtml(x)}</span>`).join("")}</div>
        <div class="reviews">
          <h5>用户评价</h5>
          <ul>
            ${(tea.ratings || [])
              .slice()
              .reverse()
              .map(
                (r) => `
              <li>
                <div class="rev-top">
                  <span>${escapeHtml(r.userName || r.userId || "用户")}</span>
                  ${starsHtml(r.stars)}
                </div>
                ${r.comment ? `<p class="rev-text">${escapeHtml(r.comment)}</p>` : ""}
              </li>`
              )
              .join("")}
          </ul>
        </div>
        <div class="rate-box">
          <h5>我要打分</h5>
          ${
            session
              ? `
            <div class="star-input" data-tea="${tid}">
              ${[1, 2, 3, 4, 5]
                .map(
                  (s) =>
                    `<button type="button" class="star-btn" data-stars="${s}" aria-label="${s} 星">★</button>`
                )
                .join("")}
            </div>
            <textarea id="cmt-${tid}" rows="2" maxlength="200" placeholder="写一句点评（可选）"></textarea>
            <button type="button" class="btn primary sm" data-submit="${tid}">提交点评</button>
            <p class="error" id="err-${tid}" hidden></p>`
              : `<p class="need-login">请先 <button type="button" class="link" data-open-login>登录</button> 后再点评。</p>`
          }
        </div>
      </div>
    </article>
  `;
}

const starPick = {};

function render() {
  const app = document.getElementById("app");
  const session = ds.getSession();
  const teas = state.teas;
  const board = state.board;

  app.innerHTML = `
    <div class="bg-blobs" aria-hidden="true"></div>
    <header class="top">
      <div class="brand">
        <span class="logo">🧋</span>
        <div>
          <h1>Hello 奶茶</h1>
          <p class="tagline">点评 · 打分 · 排行榜</p>
        </div>
      </div>
      <div class="auth">
        ${
          session
            ? `<span class="hi">你好，<strong>${escapeHtml(session.name)}</strong></span>
               <button type="button" class="btn ghost" id="btn-logout">退出</button>`
            : `<button type="button" class="btn primary" id="btn-open-login">登录</button>`
        }
      </div>
    </header>

    <main class="layout">
      ${
        state.error
          ? `<section class="panel"><p class="error-banner">${escapeHtml(state.error)}</p></section>`
          : ""
      }
      ${
        state.loading
          ? `<section class="panel"><p class="loading-hint">加载中…</p></section>`
          : ""
      }

      <section class="panel hero">
        <h2>发现一杯好奶茶</h2>
        <p>${heroText()}</p>
        <div class="pill-row">
          <span class="pill">登录后点评</span>
          <span class="pill">五星打分</span>
          <span class="pill">实时榜</span>
        </div>
      </section>

      <section class="panel">
        <div class="section-head">
          <h3>排行榜</h3>
          <span class="hint">按平均分排序 · 显示打分人数</span>
        </div>
        <ol class="rank-list">
          ${
            board.length === 0
              ? `<li class="empty">还没有评分，去下面给奶茶打个分吧。</li>`
              : board
                  .map(
                    (row) => `
            <li class="rank-item">
              <span class="rank-num">${row.rank}</span>
              <div class="rank-main">
                <div class="rank-title">${escapeHtml(row.tea.name)}</div>
                <div class="rank-sub">${escapeHtml(row.tea.shop)}${
                      row.tea.tags?.length ? " · " + row.tea.tags.map(escapeHtml).join(" · ") : ""
                    }</div>
              </div>
              <div class="rank-score">
                <span class="score">${row.avg.toFixed(1)}</span>
                <span class="meta">${row.count} 人打分</span>
              </div>
            </li>`
                  )
                  .join("")
          }
        </ol>
      </section>

      <section class="panel">
        <div class="section-head">
          <h3>奶茶列表</h3>
          <span class="hint">点击卡片展开点评</span>
        </div>
        <div class="tea-grid">
          ${teas.map((t) => cardHtml(t, selectedTeaId === String(t.id))).join("")}
        </div>
      </section>
    </main>

    <footer class="foot">
      <span>Hello_milkTea</span>
      <span class="sep">·</span>
      <span>API：<code>/api/v1</code> · mock：<code>${api.USE_MOCK ? "on" : "off"}</code></span>
    </footer>

    <div class="modal ${loginOpen ? "show" : ""}" id="modal-login" role="dialog" aria-modal="true" aria-labelledby="login-title">
      <div class="modal-backdrop" data-close="1"></div>
      <div class="modal-card">
        <div class="tabs">
          <button type="button" class="tab ${loginMode === "login" ? "active" : ""}" id="tab-login">登录</button>
          <button type="button" class="tab ${loginMode === "register" ? "active" : ""}" id="tab-register">注册</button>
        </div>
        <h4 id="login-title">${loginMode === "login" ? "登录" : "注册"}</h4>
        <p class="modal-desc">${
          api.USE_MOCK
            ? "本地演示：可只填昵称。"
            : "对接 milk_tea_go：用户名 + 密码；新用户请先注册。"
        }</p>
        ${
          loginMode === "register" && !api.USE_MOCK
            ? `<label class="field">
          <span>邮箱</span>
          <input type="email" id="reg-email" placeholder="you@example.com" autocomplete="email" />
        </label>`
            : ""
        }
        <label class="field">
          <span>用户名</span>
          <input type="text" id="login-name" placeholder="3–32 位" maxlength="32" autocomplete="username" />
        </label>
        ${
          loginMode === "register" && !api.USE_MOCK
            ? `<label class="field">
          <span>昵称（可选）</span>
          <input type="text" id="reg-nick" placeholder="展示名称" maxlength="64" />
        </label>`
            : ""
        }
        <label class="field">
          <span>${api.USE_MOCK ? "昵称（mock）" : "密码"}</span>
          <input type="password" id="login-pass" placeholder="${api.USE_MOCK ? "可留空" : "至少 8 位"}" autocomplete="current-password" />
        </label>
        <p class="error" id="login-err" hidden></p>
        <div class="modal-actions">
          <button type="button" class="btn ghost" id="login-cancel">取消</button>
          <button type="button" class="btn primary" id="login-ok">${loginMode === "login" ? "进入" : "注册并登录"}</button>
        </div>
      </div>
    </div>
  `;

  bindEvents();
}

async function reloadData() {
  state.teas = await ds.listTeas();
  state.board = await ds.fetchLeaderboard();
  if (!api.USE_MOCK) {
    state.teas.forEach((t) => {
      delete t._reviewsLoaded;
      t.ratings = [];
    });
  }
}

async function openTeaToggle(rawId) {
  const id = String(rawId);
  if (selectedTeaId === id) {
    selectedTeaId = null;
    render();
    return;
  }
  selectedTeaId = id;
  if (!api.USE_MOCK) {
    const tea = state.teas.find((t) => String(t.id) === id);
    if (tea && !tea._reviewsLoaded) {
      try {
        const revs = await ds.loadReviewsForTea(id);
        tea.ratings = revs;
        tea._reviewsLoaded = true;
      } catch (e) {
        state.error = e.message || String(e);
      }
    }
  }
  render();
}

function bindEvents() {
  document.getElementById("btn-open-login")?.addEventListener("click", () => {
    loginOpen = true;
    loginMode = "login";
    render();
    queueMicrotask(() => document.getElementById("login-name")?.focus());
  });

  document.getElementById("btn-logout")?.addEventListener("click", async () => {
    await ds.logout();
    selectedTeaId = null;
    await reloadData();
    render();
  });

  document.querySelectorAll("[data-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-toggle");
      openTeaToggle(id);
    });
  });

  document.querySelectorAll("[data-open-login]").forEach((b) => {
    b.addEventListener("click", () => {
      loginOpen = true;
      loginMode = "login";
      render();
    });
  });

  document.getElementById("tab-login")?.addEventListener("click", () => {
    loginMode = "login";
    render();
  });
  document.getElementById("tab-register")?.addEventListener("click", () => {
    loginMode = "register";
    render();
  });

  document.getElementById("login-cancel")?.addEventListener("click", () => {
    loginOpen = false;
    render();
  });
  document.querySelector("#modal-login .modal-backdrop")?.addEventListener("click", () => {
    loginOpen = false;
    render();
  });

  document.getElementById("login-ok")?.addEventListener("click", async () => {
    const err = document.getElementById("login-err");
    err.hidden = true;
    const username = (document.getElementById("login-name")?.value || "").trim();
    const password = document.getElementById("login-pass")?.value || "";
    try {
      if (api.USE_MOCK) {
        await ds.login(username, password || "mock");
        loginOpen = false;
        await reloadData();
        render();
        return;
      }
      if (loginMode === "register") {
        const email = (document.getElementById("reg-email")?.value || "").trim();
        const nick = (document.getElementById("reg-nick")?.value || "").trim();
        if (!email) throw new Error("请填写邮箱");
        await ds.register({ username, email, password, nickname: nick });
        await ds.login(username, password);
      } else {
        await ds.login(username, password);
      }
      loginOpen = false;
      state.error = null;
      await reloadData();
      render();
    } catch (e) {
      err.textContent = e.message || "失败";
      err.hidden = false;
    }
  });

  document.querySelectorAll(".star-input").forEach((el) => {
    const teaId = el.getAttribute("data-tea");
    starPick[teaId] = starPick[teaId] || 5;
    el.querySelectorAll(".star-btn").forEach((b) => {
      b.classList.toggle("active", +b.getAttribute("data-stars") <= starPick[teaId]);
      b.addEventListener("click", () => {
        starPick[teaId] = +b.getAttribute("data-stars");
        el.querySelectorAll(".star-btn").forEach((x) => {
          x.classList.toggle("active", +x.getAttribute("data-stars") <= starPick[teaId]);
        });
      });
    });
  });

  document.querySelectorAll("[data-submit]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const teaId = btn.getAttribute("data-submit");
      const errEl = document.getElementById(`err-${teaId}`);
      const ta = document.getElementById(`cmt-${teaId}`);
      errEl.hidden = true;
      try {
        await ds.submitReview(teaId, {
          stars: starPick[teaId] || 5,
          comment: ta?.value || "",
        });
        selectedTeaId = teaId;
        state.error = null;
        await reloadData();
        if (!api.USE_MOCK) {
          const tea = state.teas.find((t) => String(t.id) === String(teaId));
          if (tea) {
            const revs = await ds.loadReviewsForTea(teaId);
            tea.ratings = revs;
            tea._reviewsLoaded = true;
          }
        }
        render();
      } catch (e) {
        errEl.textContent = e.message || "提交失败";
        errEl.hidden = false;
      }
    });
  });
}

export async function mount() {
  state.loading = true;
  state.error = null;
  render();
  try {
    await ds.bootstrap();
    await reloadData();
  } catch (e) {
    state.error = e.message || String(e);
  } finally {
    state.loading = false;
  }
  render();
}
