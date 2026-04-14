import "./style.css";
import { mount } from "./app.js";

mount().catch((e) => {
  console.error(e);
  document.getElementById("app").innerHTML = `<p class="fatal">启动失败：${String(e?.message || e)}</p>`;
});
