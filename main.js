// MouseOS site. Your mouse becomes the app's orange pointer; the hero grid,
// the tilting phone and the install cards are animated with GSAP. Everything
// still works — static — if GSAP doesn't load or motion is reduced.
document.documentElement.classList.add("js");

const REPO = "MathisZerbib/mouseos";
// Set once the Play listing is live — every "Google Play" button follows.
const PLAY_URL = "";

const G = window.gsap;
if (G && window.ScrollTrigger) G.registerPlugin(window.ScrollTrigger);
// Real time, always: lag smoothing would crawl entrances on a slow first frame
// and leave the page looking empty.
if (G) G.ticker.lagSmoothing(0);
const animate = !!G && !matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
const pointer = { x: -1, y: -1 }; // last mouse position, shared by the cursor and the hero

/* ——— the cursor: the app's orange dot replaces the system arrow ——— */
(function cursor() {
  if (!finePointer) return;
  const dot = Object.assign(document.createElement("div"), { className: "cursor" });
  document.body.append(dot);
  document.documentElement.classList.add("cursor-on");
  const set = (k) => (G ? G.quickTo(dot, k, { duration: 0.16, ease: "power3" }) : (v) => (dot.style[k === "x" ? "left" : "top"] = v + "px"));
  const toX = set("x"), toY = set("y");
  const scale = (s) => (G ? G.to(dot, { scale: s, duration: 0.25, ease: "power3" }) : (dot.style.transform = `scale(${s})`));
  let over = false;

  addEventListener("pointermove", (e) => {
    pointer.x = e.clientX; pointer.y = e.clientY;
    toX(e.clientX); toY(e.clientY);
    dot.style.opacity = 1;
  }, { passive: true });
  document.addEventListener("pointerleave", () => (dot.style.opacity = 0));
  addEventListener("blur", () => (dot.style.opacity = 0));

  const TARGETS = "a, button, summary, [role='tab'], .tabbar button";
  document.addEventListener("pointerover", (e) => {
    const t = !!e.target.closest(TARGETS);
    if (t === over) return;
    over = t; dot.classList.toggle("on-target", t); scale(t ? 3 : 1);
  });
  addEventListener("pointerdown", () => scale(over ? 2.4 : 0.7));
  addEventListener("pointerup", () => scale(over ? 3 : 1));
})();

/* ——— hero: the trackpad grid; its axes cross wherever the pointer is ——— */
(function heroGrid() {
  const canvas = document.querySelector(".hero-grid");
  const hero = document.querySelector(".hero");
  if (!canvas || !hero) return;
  const ctx = canvas.getContext("2d");
  const CELL = 28, R = 9, GAP = 22, DASH = 6;
  let w = 0, h = 0, x = 0, y = 0, tx = 0, ty = 0, steered = 0, visible = true;

  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    w = hero.clientWidth; h = hero.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!x) { x = tx = w * 0.56; y = ty = h * 0.86; }
    draw();
  }

  function line(x1, y1, x2, y2) { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    ctx.lineWidth = 1; ctx.setLineDash([]); ctx.strokeStyle = "rgba(242,239,232,0.055)";
    ctx.beginPath();
    for (let gx = (w / 2) % CELL; gx < w; gx += CELL) { ctx.moveTo(gx + 0.5, 0); ctx.lineTo(gx + 0.5, h); }
    for (let gy = (h / 2) % CELL; gy < h; gy += CELL) { ctx.moveTo(0, gy + 0.5); ctx.lineTo(w, gy + 0.5); }
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,77,0,0.55)"; ctx.lineWidth = 1.5; ctx.setLineDash([DASH, DASH]);
    line(0, y, x - GAP, y); line(x + GAP, y, w, y); line(x, 0, x, y - GAP); line(x, y + GAP, x, h);
    // The dot itself is the custom cursor while it's in the hero; otherwise draw it.
    if (!(finePointer && insideHero())) {
      ctx.setLineDash([]); ctx.fillStyle = "#ff4d00";
      ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); ctx.fill();
    }
  }

  function insideHero() {
    const r = hero.getBoundingClientRect();
    return pointer.x >= r.left && pointer.x <= r.right && pointer.y >= r.top && pointer.y <= r.bottom;
  }

  function tick(t) {
    if (!visible) return;
    if (finePointer && insideHero()) {
      const r = canvas.getBoundingClientRect();
      tx = pointer.x - r.left; ty = pointer.y - r.top;
    } else if (performance.now() - steered > 2500) { // idle: a lazy figure-eight
      tx = w * (0.5 + 0.42 * Math.sin(t / 2600));
      ty = h * (0.5 + 0.38 * Math.sin(t / 1900));
    }
    const k = finePointer && insideHero() ? 0.35 : 0.08;
    x += (tx - x) * k; y += (ty - y) * k;
    draw();
    requestAnimationFrame(tick);
  }

  // Touch: dragging the grid steers it.
  hero.addEventListener("pointermove", (e) => {
    if (finePointer) return;
    const r = canvas.getBoundingClientRect();
    tx = e.clientX - r.left; ty = e.clientY - r.top; steered = performance.now();
  }, { passive: true });
  addEventListener("resize", resize);
  resize();
  if (!animate) return;
  new IntersectionObserver(([entry]) => {
    const was = visible; visible = entry.isIntersecting;
    if (visible && !was) requestAnimationFrame(tick);
  }).observe(hero);
  requestAnimationFrame(tick);
})();

/* ——— the hero phone aims at your mouse, like the air mouse aims at the screen ——— */
(function tilt() {
  const phone = document.querySelector(".tilt");
  if (!phone || !animate || !finePointer) return;
  const rx = G.quickTo(phone, "rotationX", { duration: 0.8, ease: "power3" });
  const ry = G.quickTo(phone, "rotationY", { duration: 0.8, ease: "power3" });
  addEventListener("pointermove", (e) => {
    ry((e.clientX / innerWidth - 0.5) * 22);
    rx(-(e.clientY / innerHeight - 0.5) * 16);
  }, { passive: true });
})();

/* ——— entrances ——— */
(function motion() {
  if (!animate) return;
  G.from("[data-intro]", { y: 44, opacity: 0, duration: 1, ease: "power3.out", stagger: 0.08, delay: 0.1 });
  if (!window.ScrollTrigger) return;
  G.set("[data-reveal]", { y: 36, opacity: 0 });
  window.ScrollTrigger.batch("[data-reveal]", {
    start: "top 88%", once: true,
    onEnter: (els) => G.to(els, { y: 0, opacity: 1, duration: 0.8, ease: "power3.out", stagger: 0.09 }),
  });
})();

/* ——— install cards: each illustration acts its step out, while on screen ——— */
(function cardArt() {
  const get = document.querySelector(".art-get"), allow = document.querySelector(".art-allow"), link = document.querySelector(".art-link");
  if (!get || !allow || !link) return;
  if (!animate) { // still: show each step done
    allow.querySelector(".track").style.fill = "#ff4d00";
    allow.querySelector(".knob").setAttribute("cx", 190);
    return;
  }
  const loop = (svg, build) => {
    const tl = G.timeline({ repeat: -1, repeatDelay: 0.8, paused: true });
    build(tl);
    if (window.ScrollTrigger) window.ScrollTrigger.create({ trigger: svg, start: "top 95%", end: "bottom 5%", onToggle: (s) => (s.isActive ? tl.play() : tl.pause()) });
    else tl.play();
  };
  loop(get, (tl) => tl
    .fromTo(get.querySelector(".app"), { x: 0, y: 0, scale: 1, opacity: 1 }, { x: 128, y: 14, scale: 0.55, svgOrigin: "60 70", duration: 1.1, ease: "power2.inOut" })
    .to(get.querySelector(".folder"), { stroke: "#ff4d00", duration: 0.2 }, "-=0.2")
    .to(get.querySelector(".app"), { opacity: 0, duration: 0.25 })
    .to(get.querySelector(".folder"), { stroke: "#4a4741", duration: 0.4 }));
  loop(allow, (tl) => tl
    .to(allow.querySelector(".knob"), { attr: { cx: 190 }, duration: 0.45, ease: "power3.inOut" })
    .to(allow.querySelector(".track"), { fill: "#ff4d00", duration: 0.3 }, "<")
    .to({}, { duration: 1.4 })
    .to(allow.querySelector(".knob"), { attr: { cx: 162 }, duration: 0.35, ease: "power2.in" })
    .to(allow.querySelector(".track"), { fill: "#2e2c28", duration: 0.3 }, "<"));
  loop(link, (tl) => tl
    .fromTo(link.querySelector(".pulse"), { x: 0, opacity: 1 }, { x: 50, duration: 0.9, ease: "power1.inOut" })
    .to(link.querySelector(".pulse"), { opacity: 0, duration: 0.2 })
    .fromTo(link.querySelector(".allow"), { scale: 1 }, { scale: 1.12, svgOrigin: "176 67", duration: 0.18, yoyo: true, repeat: 1, ease: "power2.out" }));
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
    const swap = () => { shot.src = src; shot.alt = `MouseOS ${items[i].dataset.tab} screen`; };
    if (!animate) return swap();
    G.timeline()
      .to(shot, { opacity: 0, y: 10, duration: 0.14, ease: "power2.in", onComplete: swap })
      .to(shot, { opacity: 1, y: 0, duration: 0.3, ease: "power3.out" });
    G.fromTo(items[i], { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.3, ease: "power3.out" });
  }
  select(0);
})();

/* ——— downloads: straight to the DMG when a release exists, honest "soon" otherwise ——— */
(function downloads() {
  const soon = (a) => {
    a.setAttribute("aria-disabled", "true");
    a.removeAttribute("href");
    if (!a.querySelector("small")) a.insertAdjacentHTML("beforeend", " <small>soon</small>");
  };
  fetch(`https://api.github.com/repos/${REPO}/releases/latest`, { headers: { Accept: "application/vnd.github+json" } })
    .then((r) => (r.ok ? r.json() : null))
    .then((rel) => {
      const dmg = rel && (rel.assets || []).find((a) => a.name.endsWith(".dmg"));
      document.querySelectorAll("[data-mac-download]").forEach((a) => {
        if (dmg) { a.href = dmg.browser_download_url; a.setAttribute("download", ""); } else soon(a);
      });
    })
    .catch(() => {}); // offline / rate-limited: keep the releases link

  document.querySelectorAll("[data-play]").forEach((a) => {
    if (PLAY_URL) { a.href = PLAY_URL; a.querySelector("small")?.remove(); } else soon(a);
  });
})();
