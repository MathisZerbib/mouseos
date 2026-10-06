// MouseOS site. Your mouse becomes the app's orange dot; the hero's dot grid
// turns into pointers wherever you move; the install stage plays the real
// setup on a Mac and a phone. Everything still reads — static — if GSAP
// doesn't load or motion is reduced.
document.documentElement.classList.add("js");

const REPO = "MathisZerbib/mouseos";
const SITE = "https://mathiszerbib.github.io/mouseos/";
// Set once the Play listing is live — every "Google Play" button follows.
const PLAY_URL = "";

const G = window.gsap;
if (G && window.ScrollTrigger) G.registerPlugin(window.ScrollTrigger);
// Real time, always: lag smoothing would crawl entrances on a slow first frame
// and leave the page looking empty.
if (G) G.ticker.lagSmoothing(0);
const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
const animate = !!G && !still;
const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
// A phone can't install the Mac app: its Mac buttons send this page to the Mac instead.
const onPhone = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Mac/.test(navigator.platform));

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
    toX(e.clientX); toY(e.clientY);
    dot.style.opacity = 1;
  }, { passive: true });
  document.addEventListener("pointerleave", () => (dot.style.opacity = 0));
  addEventListener("blur", () => (dot.style.opacity = 0));

  const TARGETS = "a, button, summary, [role='tab'], .js .step";
  document.addEventListener("pointerover", (e) => {
    const t = !!e.target.closest(TARGETS);
    if (t === over) return;
    over = t; dot.classList.toggle("on-target", t); scale(t ? 3 : 1);
  });
  addEventListener("pointerdown", () => scale(over ? 2.4 : 0.7));
  addEventListener("pointerup", () => scale(over ? 3 : 1));
})();

/* ——— hero: a grid of dots that turn into pointers wherever you move ——— */
(function field() {
  const hero = document.querySelector(".hero");
  const canvas = hero && hero.querySelector(".field");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const phone = hero.querySelector(".hero-device .phone");
  const PITCH = 30, REACH = 104;
  // The Mac arrow, tip at the origin, pivoting around its middle.
  const ARROW = [[0, 0], [0, 16], [4, 12.3], [6.6, 18.2], [9, 17.2], [6.4, 11.4], [11.4, 11.4]].map(([x, y]) => [x - 5.3, y - 12.4]);
  const AIM = Math.atan2(-12.4, -5.3); // the way the glyph points, unrotated
  // Eight inks from faint bone to full signal orange, one fill each per frame.
  const INK = Array.from({ length: 8 }, (_, b) => {
    const t = b / 7, m = Math.min(1, Math.max(0, (t - 0.3) / 0.5));
    return `rgba(${Math.round(242 + 13 * m)},${Math.round(239 - 162 * m)},${Math.round(232 - 232 * m)},${(0.3 + 0.7 * t).toFixed(2)})`;
  });
  let w = 0, h = 0, dpr = 1, cols = 0, rows = 0, ox = 0, oy = 0;
  let energy = new Float32Array(0), heading = new Float32Array(0);
  let waves = [], last = null, moved = 0, running = false, visible = true, then = 0;

  function resize() {
    const nw = hero.clientWidth, nh = hero.clientHeight, nd = Math.min(devicePixelRatio || 1, 2);
    if (nw === w && nh === h && nd === dpr) return;
    w = nw; h = nh; dpr = nd;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    cols = Math.ceil(w / PITCH) + 1; rows = Math.ceil(h / PITCH) + 1;
    ox = (w - (cols - 1) * PITCH) / 2; oy = (h - (rows - 1) * PITCH) / 2;
    energy = new Float32Array(cols * rows); heading = new Float32Array(cols * rows);
    draw();
  }

  function excite(i, f, dir) {
    if (f > energy[i]) { energy[i] = f; heading[i] = dir; }
  }

  // A pointer stroke wakes the cells it passes, aimed along the motion.
  function stroke(x0, y0, x1, y1) {
    const dx = x1 - x0, dy = y1 - y0, len2 = dx * dx + dy * dy;
    if (len2 < 1) return;
    const amp = Math.min(1, 0.4 + Math.sqrt(len2) / 28), dir = Math.atan2(dy, dx);
    const c0 = Math.max(0, Math.floor((Math.min(x0, x1) - REACH - ox) / PITCH));
    const c1 = Math.min(cols - 1, Math.ceil((Math.max(x0, x1) + REACH - ox) / PITCH));
    const r0 = Math.max(0, Math.floor((Math.min(y0, y1) - REACH - oy) / PITCH));
    const r1 = Math.min(rows - 1, Math.ceil((Math.max(y0, y1) + REACH - oy) / PITCH));
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
      const px = ox + c * PITCH, py = oy + r * PITCH;
      const t = Math.max(0, Math.min(1, ((px - x0) * dx + (py - y0) * dy) / len2));
      const d = Math.hypot(x0 + t * dx - px, y0 + t * dy - py);
      if (d < REACH) excite(r * cols + c, (1 - d / REACH) ** 2 * amp, dir);
    }
  }

  // A ring leaving the phone — the beacon the app uses to find your Mac.
  function ping(amp) {
    if (!phone) return;
    const p = phone.getBoundingClientRect(), r = hero.getBoundingClientRect();
    waves.push({ x: p.left + p.width / 2 - r.left, y: p.top + p.height * 0.45 - r.top, r: 0, amp });
    wake();
  }
  function spread(dt) {
    const far = Math.hypot(w, h), BAND = 64;
    waves = waves.filter((v) => {
      v.r += dt * 0.75;
      const amp = v.amp * (1 - v.r / far);
      for (let r = 0, i = 0; r < rows; r++) for (let c = 0; c < cols; c++, i++) {
        const px = ox + c * PITCH - v.x, py = oy + r * PITCH - v.y;
        const off = Math.abs(Math.hypot(px, py) - v.r);
        if (off < BAND) excite(i, (1 - off / BAND) * amp, Math.atan2(py, px));
      }
      return v.r < far;
    });
  }

  function arrow(x, y, rot, s) {
    const cs = Math.cos(rot) * s, sn = Math.sin(rot) * s;
    for (let k = 0; k < ARROW.length; k++) {
      const ax = ARROW[k][0], ay = ARROW[k][1];
      const px = x + ax * cs - ay * sn, py = y + ax * sn + ay * cs;
      if (k) ctx.lineTo(px, py); else ctx.moveTo(px, py);
    }
    ctx.closePath();
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "rgba(242,239,232,0.12)"; // the grid at rest: square dots
    ctx.beginPath();
    for (let r = 0, i = 0; r < rows; r++) for (let c = 0; c < cols; c++, i++) {
      if (energy[i] < 0.3) ctx.rect(ox + c * PITCH - 1, oy + r * PITCH - 1, 2, 2);
    }
    ctx.fill();
    for (let b = 0; b < INK.length; b++) {
      let any = false;
      ctx.beginPath();
      for (let i = 0; i < energy.length; i++) {
        const e = energy[i];
        if (e < 0.05 || Math.min(7, (e * 8) | 0) !== b) continue;
        arrow(ox + (i % cols) * PITCH, oy + ((i / cols) | 0) * PITCH, heading[i] - AIM, 0.28 + 0.62 * e);
        any = true;
      }
      if (any) { ctx.fillStyle = INK[b]; ctx.fill(); }
    }
  }

  function frame(now) {
    const dt = then ? Math.min(50, now - then) : 16;
    then = now;
    const k = Math.pow(0.95, dt / 16.7);
    let live = 0;
    for (let i = 0; i < energy.length; i++) {
      if (!energy[i]) continue;
      const e = energy[i] * k;
      energy[i] = e < 0.01 ? 0 : e;
      live++;
    }
    spread(dt);
    draw();
    if ((live || waves.length) && visible) requestAnimationFrame(frame);
    else { running = false; then = 0; }
  }
  function wake() {
    if (running || !visible || still) return;
    running = true;
    requestAnimationFrame(frame);
  }

  addEventListener("pointermove", (e) => {
    const r = hero.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    const near = x > -REACH && y > -REACH && x < w + REACH && y < h + REACH;
    if (near && last) stroke(last[0], last[1], x, y);
    last = near ? [x, y] : null;
    if (near) { moved = performance.now(); wake(); }
  }, { passive: true });
  addEventListener("pointerup", (e) => { if (e.pointerType !== "mouse") last = null; });
  addEventListener("pointercancel", () => (last = null));
  new ResizeObserver(resize).observe(hero);
  resize();
  if (still) return;
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) wake(); }).observe(hero);
  setTimeout(() => ping(1), 900);
  setInterval(() => { if (visible && !document.hidden && performance.now() - moved > 4000) ping(0.55); }, 6000);
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

/* ——— install: the stage plays the real setup, step by step ——— */
(function setup() {
  const stage = document.querySelector(".stage");
  const steps = [...document.querySelectorAll(".step")];
  if (!stage || steps.length !== 4) return;
  const scene = stage.querySelector(".scene");
  const fit = () => scene.style.setProperty("--k", stage.clientWidth / 760);
  new ResizeObserver(fit).observe(stage);
  fit();
  if (!G) return; // the still frame stays
  // Positions are measured from the laid-out drawing: wait for the fonts.
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => play(stage, steps));
})();

function play(stage, steps) {
  const q = (s) => stage.querySelector(s);
  const display = q(".display"), cam = q(".cam"), screen = q(".screen");
  const ptr = q(".ptr"), ring = q(".ring"), ghost = q(".ghost"), touch = q(".touch");
  const dmg = q(".win-dmg"), alert = q(".win-alert"), privacy = q(".win-privacy"), app = q(".win-app"), access = q(".win-access");
  const shotAllow = q(".shot-allow"), shotWaiting = q(".shot-waiting"), shotApprove = q(".shot-approve");
  const pIntro = q(".p-intro"), pAllow = q(".p-allow"), pPad = q(".p-pad");
  const dockApp = q(".dock-app"), homeApp = q(".home-app"), dmgIcon = q(".dmg-app img"), folder = q(".dmg-folder");
  const done = q(".alert-done"), anyway = q(".open-anyway"), toggle = q(".toggle"), knob = q(".toggle i");
  const link = q(".link"), pulse = q(".pulse"), trailMac = q(".trail-mac"), trailPad = q(".trail-pad");
  const BLUE = "#0a84ff", W = 760, H = 470;

  // Where a point of an element sits, in an ancestor's drawing units
  // (layout offsets ignore the stage's scaling and the camera).
  const at = (node, fx = 0.5, fy = 0.5, root = display) => {
    let x = node.offsetWidth * fx, y = node.offsetHeight * fy;
    for (let n = node; n && n !== root; n = n.offsetParent) { x += n.offsetLeft; y += n.offsetTop; }
    return [x, y];
  };
  const ICON = at(dmgIcon), FOLDER = at(folder), DONE = at(done), ANYWAY = at(anyway), TOGGLE = at(toggle);
  const ALLOW_CONTROL = at(shotAllow, 0.5, 0.279), ALLOW_PHONE = at(shotApprove, 0.281, 0.214);
  const HOME_APP = at(homeApp, 0.5, 0.5, screen);

  const tl = G.timeline({ paused: true, repeat: -1, repeatDelay: 0.8, defaults: { ease: "power2.inOut" } });
  const CAPS = [];
  const cap = (t, dev, text) => CAPS.push({ t, dev, text });
  const move = (xy, t, d = 0.75) => tl.to(ptr, { x: xy[0], y: xy[1], duration: d }, t);
  const click = (xy, t) => tl
    .to(ptr, { scale: 0.8, duration: 0.08, yoyo: true, repeat: 1, ease: "power1.inOut" }, t)
    .fromTo(ring, { x: xy[0], y: xy[1], scale: 0.4, autoAlpha: 1 }, { scale: 1.8, autoAlpha: 0, duration: 0.5, ease: "power2.out", immediateRender: false }, t);
  const show = (node, t, d = 0.32) => tl.fromTo(node, { autoAlpha: 0, scale: 0.94 }, { autoAlpha: 1, scale: 1, duration: d, ease: "back.out(1.7)", immediateRender: false }, t);
  const hide = (node, t, d = 0.22) => tl.to(node, { autoAlpha: 0, scale: 0.97, duration: d, ease: "power2.in" }, t);
  const swap = (from, to, t, d = 0.3) => tl.to(from, { autoAlpha: 0, duration: d }, t).to(to, { autoAlpha: 1, duration: d }, t);
  const bounce = (t, times = 1) => tl.to(dockApp, { y: -7, duration: 0.2, yoyo: true, repeat: times * 2 - 1, ease: "power2.out" }, t);
  const tap = (xy, t) => tl
    .fromTo(touch, { x: xy[0], y: xy[1], scale: 0.5, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.14, ease: "power2.out", immediateRender: false }, t)
    .to(touch, { scale: 1.7, autoAlpha: 0, duration: 0.4, ease: "power2.out" }, t + 0.22);
  // The camera leans in on the thing to click, then pulls back.
  const look = (node, fx, fy, s, t, d = 0.8) => {
    const [px, py] = at(node, fx, fy, cam);
    const x = Math.min(0, Math.max(W - s * W, W / 2 - s * px)), y = Math.min(0, Math.max(H - s * H, H / 2 - s * py));
    tl.to(cam, { x, y, scale: s, duration: d, ease: "power3.inOut" }, t);
  };
  const wide = (t, d = 0.7) => tl.to(cam, { x: 0, y: 0, scale: 1, duration: d, ease: "power3.inOut" }, t);
  // Every step starts from a fully stated frame, so any step can be jumped to.
  const start = (t, { wins = [], shot, phone, dock = true, from }) => {
    tl.set([dmg, alert, privacy, app, access, shotAllow, shotWaiting, shotApprove, pIntro, pAllow, pPad, ghost, ring, touch, link, trailMac.parentNode, trailPad.parentNode], { autoAlpha: 0, scale: 1 }, t)
      .set([...wins, shot, phone].filter(Boolean).concat(dock ? dockApp : []), { autoAlpha: 1 }, t)
      .set(dockApp, { y: 0 }, t)
      .set(toggle, { backgroundColor: "rgba(255,255,255,0.2)" }, t)
      .set(knob, { x: 0 }, t)
      .set(anyway, { backgroundColor: "rgba(255,255,255,0.13)" }, t)
      .set(dmgIcon, { opacity: 1 }, t)
      .set(folder, { filter: "brightness(1)" }, t)
      .set(cam, { x: 0, y: 0, scale: 1 }, t)
      .set(ptr, { left: 0, top: 0, x: from[0], y: from[1], scale: 1, transformOrigin: "1px 1px" }, t);
    if (!dock) tl.set(dockApp, { autoAlpha: 0 }, t);
  };

  const S = [0, 9, 14.4, 18.3], END = 25.8;
  let t = S[0];

  // 1 — Download and open
  start(t, { dock: false, from: [430, 250] });
  cap(t, "Mac", "Open the download, drag MouseOS into Applications");
  show(dmg, t + 0.2);
  move(ICON, t + 0.6, 0.8);
  tl.to(ptr, { scale: 0.85, duration: 0.08 }, t + 1.45)
    .set(ghost, { x: ICON[0], y: ICON[1], autoAlpha: 0.9, scale: 1 }, t + 1.5)
    .to(dmgIcon, { opacity: 0.4, duration: 0.15 }, t + 1.5)
    .to([ptr, ghost], { x: FOLDER[0], y: FOLDER[1], duration: 1 }, t + 1.55)
    .to(folder, { filter: "brightness(1.45)", duration: 0.15 }, t + 2.4)
    .to(ptr, { scale: 1, duration: 0.08 }, t + 2.6)
    .to(ghost, { scale: 0.3, autoAlpha: 0, duration: 0.3, ease: "power2.in" }, t + 2.6)
    .to(folder, { filter: "brightness(1)", duration: 0.3 }, t + 2.75)
    .to(dmgIcon, { opacity: 1, duration: 0.2 }, t + 2.75);
  hide(dmg, t + 3.1);
  tl.set(dockApp, { autoAlpha: 1 }, t + 3.35);
  bounce(t + 3.35);
  cap(t + 3.3, "Mac", "First open: macOS stops it once");
  show(alert, t + 3.8);
  move(DONE, t + 4.3, 0.7);
  click(DONE, t + 5.05);
  hide(alert, t + 5.2);
  cap(t + 5.35, "Mac", "Privacy & Security → Open Anyway");
  show(privacy, t + 5.4, 0.35);
  look(anyway, 0.5, 0.5, 1.5, t + 5.6);
  move(ANYWAY, t + 5.8, 0.8);
  click(ANYWAY, t + 6.7);
  tl.to(anyway, { backgroundColor: BLUE, duration: 0.1 }, t + 6.7);
  wide(t + 7.0);
  hide(privacy, t + 7.05);
  cap(t + 7.2, "Mac", "MouseOS opens");
  tl.set(shotAllow, { autoAlpha: 1 }, t + 7.25);
  show(app, t + 7.25, 0.4);
  bounce(t + 7.25);

  // 2 — Allow control
  t = S[1];
  start(t, { wins: [app], shot: shotAllow, from: [440, 236] });
  cap(t, "Mac", "Click ALLOW CONTROL");
  look(shotAllow, 0.5, 0.279, 1.55, t + 0.1);
  move(ALLOW_CONTROL, t + 0.3, 0.8);
  click(ALLOW_CONTROL, t + 1.15);
  wide(t + 1.35, 0.6);
  show(access, t + 1.45, 0.35);
  cap(t + 1.5, "Mac", "Switch MouseOS on");
  look(toggle, 0.5, 0.5, 1.7, t + 1.9);
  move(TOGGLE, t + 2.0, 0.7);
  click(TOGGLE, t + 2.75);
  tl.to(knob, { x: 9, duration: 0.2, ease: "power2.out" }, t + 2.8)
    .to(toggle, { backgroundColor: BLUE, duration: 0.2 }, t + 2.8);
  wide(t + 3.4);
  hide(access, t + 3.5);
  cap(t + 3.7, "Mac", "Control allowed — now the phone");
  swap(shotAllow, shotWaiting, t + 3.8);

  // 3 — Open the phone app
  t = S[2];
  start(t, { wins: [app], shot: shotWaiting, from: [470, 252] });
  cap(t, "Phone", "Open MouseOS on your phone");
  tap(HOME_APP, t + 0.5);
  tl.to(homeApp, { scale: 0.86, duration: 0.1, yoyo: true, repeat: 1 }, t + 0.5)
    .fromTo(pIntro, { autoAlpha: 0, scale: 0.2, transformOrigin: `${HOME_APP[0]}px ${HOME_APP[1]}px` },
      { autoAlpha: 1, scale: 1, duration: 0.4, ease: "power3.out", immediateRender: false }, t + 0.75);
  cap(t + 1.4, "Phone", "It finds your Mac by itself");
  const LEN = pulse.getTotalLength();
  tl.set(link, { autoAlpha: 1 }, t + 1.4)
    .fromTo(pulse, { strokeDashoffset: 18 }, { strokeDashoffset: -LEN, duration: 0.9, ease: "power1.inOut", repeat: 1, immediateRender: false }, t + 1.45);
  swap(pIntro, pAllow, t + 2.6);
  tl.to(link, { autoAlpha: 0, duration: 0.4 }, t + 3.3);

  // 4 — Click ALLOW, then the payoff: a finger on the pad drives the Mac's pointer
  t = S[3];
  start(t, { wins: [app], shot: shotWaiting, phone: pAllow, from: [470, 240] });
  cap(t, "Mac", "Click ALLOW — once per phone");
  swap(shotWaiting, shotApprove, t + 0.15);
  bounce(t + 0.15, 2);
  look(shotApprove, 0.281, 0.214, 1.6, t + 0.4);
  move(ALLOW_PHONE, t + 0.6, 0.8);
  click(ALLOW_PHONE, t + 1.5);
  wide(t + 1.8);
  hide(app, t + 1.9, 0.3);
  swap(pAllow, pPad, t + 1.95);
  cap(t + 2.2, "Done", "Your phone is the mouse");
  // A figure of eight, as a thumb would draw it; the pad and the desk share its shape.
  const PATH = Array.from({ length: 25 }, (_, i) => {
    const a = (i / 24) * Math.PI * 2;
    return [0.5 + 0.42 * Math.sin(a), 0.5 + 0.4 * Math.sin(2 * a)];
  });
  const PAD = { x: 18, y: 44, w: 100, h: 120 }, DESK = { x: 140, y: 28, w: 250, h: 250 };
  const on = (box, [u, v]) => [box.x + u * box.w, box.y + v * box.h];
  const track = (box) => ({ x: PATH.map((p) => on(box, p)[0]), y: PATH.map((p) => on(box, p)[1]), easeEach: "none" });
  // The same stroke drawn on both screens, segment by segment with the same easing as the dots.
  const trace = (path, box) => {
    const pts = PATH.map((p) => on(box, p));
    path.setAttribute("d", "M" + pts.map((p) => p.join(" ")).join("L"));
    let run = 0;
    const left = pts.map((p, i) => (i ? (run += Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1])) : 0)).map((d) => run - d);
    tl.set(path, { strokeDasharray: run, strokeDashoffset: run }, t)
      .set(path.parentNode, { autoAlpha: 1 }, t + 2.5)
      .to(path, { keyframes: { strokeDashoffset: left, easeEach: "none" }, duration: 3, ease: "sine.inOut" }, t + 2.6)
      .to(path.parentNode, { autoAlpha: 0, duration: 0.6 }, t + 6.6);
  };
  trace(trailPad, PAD);
  trace(trailMac, DESK);
  move(on(DESK, PATH[0]), t + 2.0, 0.5);
  tl.fromTo(touch, { x: on(PAD, PATH[0])[0], y: on(PAD, PATH[0])[1], scale: 0.6, autoAlpha: 0 },
      { scale: 1, autoAlpha: 0.9, duration: 0.2, immediateRender: false }, t + 2.4)
    .to(touch, { keyframes: track(PAD), duration: 3, ease: "sine.inOut" }, t + 2.6)
    .to(ptr, { keyframes: track(DESK), duration: 3, ease: "sine.inOut" }, t + 2.6)
    .to(touch, { autoAlpha: 0, duration: 0.2 }, t + 5.65);
  tap(on(PAD, PATH.at(-1)), t + 6.0);
  click(on(DESK, PATH.at(-1)), t + 6.1);
  tl.set({}, {}, END); // hold the last frame a beat

  // The list follows the stage: active step, its rail filling, the caption.
  const capDev = document.querySelector(".cap b"), capText = document.querySelector(".cap span"), capN = document.querySelector(".cap-n");
  const rails = steps.map((li) => li.querySelector(".rail i"));
  let shownStep = -1, shownCap = -1;
  function sync() {
    const time = tl.time();
    let s = 0;
    while (s < 3 && time >= S[s + 1]) s++;
    const part = Math.min(1, (time - S[s]) / ((s < 3 ? S[s + 1] : END) - S[s]));
    rails.forEach((r, i) => (r.style.transform = `scaleY(${i < s ? 1 : i > s ? 0 : part})`));
    if (s !== shownStep) {
      shownStep = s;
      steps.forEach((li, i) => li.classList.toggle("on", i === s));
      capN.textContent = `${s + 1}/4`;
    }
    let c = 0;
    while (c < CAPS.length - 1 && time >= CAPS[c + 1].t) c++;
    if (c !== shownCap) { shownCap = c; capDev.textContent = CAPS[c].dev; capText.textContent = CAPS[c].text; }
  }
  tl.eventCallback("onUpdate", sync);

  const btn = document.querySelector(".play");
  let held = false, inView = false;
  const run = () => (inView && !held && !still ? tl.play() : tl.pause());
  // Reduced motion: no playing — each step shows its finished frame.
  const go = (i) => { tl.seek(still ? (i < 3 ? S[i + 1] : END) - 0.01 : S[i] + 0.001); sync(); run(); };
  steps.forEach((li, i) => li.addEventListener("click", (e) => { if (!e.target.closest("a, button")) go(i); }));
  btn.addEventListener("click", () => {
    held = !held;
    btn.textContent = held ? "Play" : "Pause";
    btn.setAttribute("aria-label", held ? "Play the setup animation" : "Pause the setup animation");
    run();
  });
  new IntersectionObserver(([en]) => { inView = en.isIntersecting; run(); }, { threshold: 0.35 }).observe(stage);
  go(0);
}

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
  document.querySelectorAll("[data-play]").forEach((a) => (PLAY_URL ? (a.href = PLAY_URL) : soon(a)));

  const macs = [...document.querySelectorAll("[data-mac-download]")];
  if (onPhone) return macs.forEach(sendToMac);
  fetch(`https://api.github.com/repos/${REPO}/releases/latest`, { headers: { Accept: "application/vnd.github+json" } })
    .then((r) => (r.ok ? r.json() : null))
    .then((rel) => {
      const dmg = rel && (rel.assets || []).find((a) => a.name.endsWith(".dmg"));
      macs.forEach((a) => { if (dmg) { a.href = dmg.browser_download_url; a.setAttribute("download", ""); } else soon(a); });
    })
    .catch(() => {}); // offline / rate-limited: keep the releases link
})();

// On a phone, "Download for Mac" becomes "Send to your Mac": share sheet, else copy the link.
function sendToMac(a) {
  a.querySelector("svg")?.remove();
  a.textContent = "Send to your Mac";
  a.href = SITE;
  a.addEventListener("click", async (e) => {
    e.preventDefault();
    if (navigator.share) return navigator.share({ title: "MouseOS for Mac", url: SITE }).catch(() => {});
    try { await navigator.clipboard.writeText(SITE); a.textContent = "Link copied — open it on your Mac"; } catch { location.href = SITE; }
  });
}
