// MouseOS site: the hero grid (a pointer you drive), the screen tabs, and
// download buttons that point at what actually exists.
document.documentElement.classList.add("js");

const REPO = "MathisZerbib/mouseos";
// Set once the Play listing is live — every "Google Play" button follows.
const PLAY_URL = "";

/* ——— hero: the trackpad grid; the dot follows your mouse like the phone drives the Mac ——— */
(function heroGrid() {
  const canvas = document.querySelector(".hero-grid");
  const hero = document.querySelector(".hero");
  if (!canvas || !hero) return;
  const ctx = canvas.getContext("2d");
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const CELL = 28, R = 11, CLEAR = 2.2, DASH = 6;
  let w = 0, h = 0, dpr = 1, x = 0, y = 0, tx = 0, ty = 0, steered = 0, visible = true;

  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = hero.clientWidth; h = hero.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!x) { x = tx = w * 0.56; y = ty = h * 0.88; } // in the open, below the copy
    draw();
  }

  function dashed(x1, y1, x2, y2) {
    ctx.setLineDash([DASH, DASH]);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    ctx.lineWidth = 1; ctx.setLineDash([]); ctx.strokeStyle = "rgba(242,239,232,0.055)";
    ctx.beginPath();
    for (let gx = (w / 2) % CELL; gx < w; gx += CELL) { ctx.moveTo(gx + 0.5, 0); ctx.lineTo(gx + 0.5, h); }
    for (let gy = (h / 2) % CELL; gy < h; gy += CELL) { ctx.moveTo(0, gy + 0.5); ctx.lineTo(w, gy + 0.5); }
    ctx.stroke();
    const gap = R * CLEAR;
    ctx.strokeStyle = "rgba(255,77,0,0.55)"; ctx.lineWidth = 1.5;
    dashed(0, y, x - gap, y); dashed(x + gap, y, w, y);
    dashed(x, 0, x, y - gap); dashed(x, y + gap, x, h);
    ctx.setLineDash([]);
    ctx.fillStyle = "#ff4d00";
    ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); ctx.fill();
  }

  function tick(t) {
    if (!visible) return;
    if (performance.now() - steered > 2500) { // idle: a lazy figure-eight across the whole hero
      tx = w * (0.5 + 0.42 * Math.sin(t / 2600));
      ty = h * (0.5 + 0.38 * Math.sin(t / 1900));
    }
    x += (tx - x) * 0.14; y += (ty - y) * 0.14;
    draw();
    requestAnimationFrame(tick);
  }

  hero.addEventListener("pointermove", (e) => {
    const r = canvas.getBoundingClientRect();
    tx = e.clientX - r.left; ty = e.clientY - r.top; steered = performance.now();
    if (still) { x = tx; y = ty; draw(); }
  });
  addEventListener("resize", resize);
  resize();
  if (!still) {
    new IntersectionObserver(([entry]) => {
      const was = visible; visible = entry.isIntersecting;
      if (visible && !was) requestAnimationFrame(tick);
    }).observe(hero);
    requestAnimationFrame(tick);
  }
})();

/* ——— features: the app's own bottom tab bar ——— */
(function tabs() {
  const items = [...document.querySelectorAll(".tab-item")];
  const bar = document.querySelector(".tabbar");
  const shot = document.querySelector(".feature-shot");
  if (!items.length || !bar || !shot) return;
  items.forEach((it) => { new Image().src = it.dataset.shot; }); // instant switches

  const buttons = items.map((it, i) => {
    const b = document.createElement("button");
    b.type = "button"; b.role = "tab"; b.id = `tabbtn-${i}`;
    b.textContent = it.dataset.tab;
    b.setAttribute("aria-controls", it.id);
    it.setAttribute("role", "tabpanel"); it.setAttribute("aria-labelledby", b.id);
    b.addEventListener("click", () => select(i));
    b.addEventListener("keydown", (e) => {
      const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (d) { e.preventDefault(); select((i + d + items.length) % items.length, true); }
    });
    bar.append(b);
    return b;
  });
  bar.hidden = false;

  function select(i, focus) {
    items.forEach((it, k) => it.classList.toggle("on", k === i));
    buttons.forEach((b, k) => { b.setAttribute("aria-selected", k === i); b.tabIndex = k === i ? 0 : -1; });
    if (focus) buttons[i].focus();
    const src = items[i].dataset.shot;
    if (shot.getAttribute("src") === src) return;
    shot.classList.add("swap");
    setTimeout(() => { shot.src = src; shot.alt = `MouseOS ${items[i].dataset.tab} screen`; shot.classList.remove("swap"); }, 160);
  }
  select(0);
})();

/* ——— downloads: straight to the DMG when a release exists, honest "soon" otherwise ——— */
(function downloads() {
  const mac = document.querySelectorAll("[data-mac-download]");
  fetch(`https://api.github.com/repos/${REPO}/releases/latest`, { headers: { Accept: "application/vnd.github+json" } })
    .then((r) => (r.ok ? r.json() : null))
    .then((rel) => {
      const dmg = rel && (rel.assets || []).find((a) => a.name.endsWith(".dmg"));
      mac.forEach((a) => {
        if (dmg) { a.href = dmg.browser_download_url; a.setAttribute("download", ""); }
        else { markSoon(a); }
      });
    })
    .catch(() => {}); // offline / rate-limited: keep the releases link

  document.querySelectorAll("[data-play]").forEach((a) => {
    if (PLAY_URL) { a.href = PLAY_URL; a.querySelector("small")?.remove(); }
    else { a.setAttribute("aria-disabled", "true"); a.removeAttribute("href"); }
  });

  function markSoon(a) {
    a.setAttribute("aria-disabled", "true");
    a.removeAttribute("href");
    if (!a.querySelector("small")) a.insertAdjacentHTML("beforeend", " <small>soon</small>");
  }
})();
