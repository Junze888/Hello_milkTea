import * as ds from "./dataService.js";
import * as mock from "./mockStore.js";

let selectedTeaId = null;
let loginOpen = false;

function starsHtml(n, max = 5) {
  const full = Math.round(n);
  let s = "";
  for (let i = 1; i <= max; i++) {
    s += `<span class="star ${i <= full ? "on" : ""}" aria-hidden="true">★</span>`;
  }
  return s;
}

function render() {
  const app = document.getElementById("app");
  const session = ds.getSession();
  const teas = mock.listTeas();
  const board = mock.leaderboard(teas);

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
      <section class="panel hero">
        <h2>发现一杯好奶茶</h2>
        <p>初版数据保存在本机浏览器，后端就绪后同一套页面可对接 Go 高并发 API。</p>
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
                    (row, i) => `
            <li class="rank-item">
              <span class="rank-num">${i + 1}</span>
              <div class="rank-main">
                <div class="rank-title">${escapeHtml(row.tea.name)}</div>
                <div class="rank-sub">${escapeHtml(row.tea.shop)} · ${row.tea.tags.join(" · ")}</div>
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
          ${teas.map((t) => cardHtml(t, selectedTeaId === t.id)).join("")}
        </div>
      </section>
    </main>

    <footer class="foot">
      <span>Hello_milkTea · 前端初版</span>
      <span class="sep">·</span>
      <span>API 预留：<code>/api/v1/...</code></span>
    </footer>

    <div class="modal ${loginOpen ? "show" : ""}" id="modal-login" role="dialog" aria-modal="true" aria-labelledby="login-title">
      <div class="modal-backdrop" data-close="1"></div>
      <div class="modal-card">
        <h4 id="login-title">登录</h4>
        <p class="modal-desc">初版仅本地昵称，用于关联你的点评。</p>
        <label class="field">
          <span>昵称</span>
          <input type="text" id="login-name" placeholder="例如：奶茶星人" maxlength="32" autocomplete="username" />
        </label>
        <label class="field">
          <span>密码（占位）</span>
          <input type="password" id="login-pass" placeholder="后端接入后校验" disabled />
        </label>
        <p class="error" id="login-err" hidden></p>
        <div class="modal-actions">
          <button type="button" class="btn ghost" id="login-cancel">取消</button>
          <button type="button" class="btn primary" id="login-ok">进入</button>
        </div>
      </div>
    </div>
  `;

  bindEvents();
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function cardHtml(tea, open) {
  const { avg, count } = mock.statsForTea(tea);
  const session = ds.getSession();
  return `
    <article class="tea-card ${open ? "open" : ""}" data-id="${tea.id}">
      <button type="button" class="tea-head" data-toggle="${tea.id}">
        <div>
          <h4>${escapeHtml(tea.name)}</h4>
          <p class="shop">${escapeHtml(tea.shop)}</p>
        </div>
        <div class="tea-meta">
          <div class="avg">${count ? avg.toFixed(1) : "—"}</div>
          <div class="small">${count} 人打分</div>
        </div>
      </button>
      <div class="tea-body" ${open ? "" : 'hidden'}>
        <div class="tags">${tea.tags.map((x) => `<span class="tag">${escapeHtml(x)}</span>`).join("")}</div>
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
            <div class="star-input" data-tea="${tea.id}">
              ${[1, 2, 3, 4, 5]
                .map(
                  (s) =>
                    `<button type="button" class="star-btn" data-stars="${s}" aria-label="${s} 星">★</button>`
                )
                .join("")}
            </div>
            <textarea id="cmt-${tea.id}" rows="2" maxlength="200" placeholder="写一句点评（可选）"></textarea>
            <button type="button" class="btn primary sm" data-submit="${tea.id}">提交点评</button>
            <p class="error" id="err-${tea.id}" hidden></p>`
              : `<p class="need-login">请先 <button type="button" class="link" data-open-login>登录</button> 后再点评。</p>`
          }
        </div>
      </div>
    </article>
  `;
}

const starPick = {};

function bindEvents() {
  document.getElementById("btn-open-login")?.addEventListener("click", () => {
    loginOpen = true;
    render();
    queueMicrotask(() => document.getElementById("login-name")?.focus());
  });

  document.getElementById("btn-logout")?.addEventListener("click", () => {
    ds.logout();
    selectedTeaId = null;
    render();
  });

  document.querySelectorAll("[data-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-toggle");
      selectedTeaId = selectedTeaId === id ? null : id;
      render();
    });
  });

  document.querySelectorAll("[data-open-login]").forEach((b) => {
    b.addEventListener("click", () => {
      loginOpen = true;
      render();
    });
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
    const name = document.getElementById("login-name")?.value || "";
    const err = document.getElementById("login-err");
    err.hidden = true;
    try {
      await ds.login(name, "");
      loginOpen = false;
      render();
    } catch (e) {
      err.textContent = e.message || "登录失败";
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
        render();
      } catch (e) {
        errEl.textContent = e.message || "提交失败";
        errEl.hidden = false;
      }
    });
  });
}

export function mount() {
  render();
}
