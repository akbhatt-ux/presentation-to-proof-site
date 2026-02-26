/*
  From Presentation to Proof — motion prototype
  - Scroll shift updates CSS variables: --v, --p, --crack, --depth, --scroll
  - Product demo: particle title animator + interactive controls
*/

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const easeInOutCubic = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

function mapShiftV(progress) {
  const p = clamp(progress, 0, 1);

  // Deliberate calm before the color flood.
  if (p < 0.44) return easeInOutCubic(p / 0.44) * 0.48;
  if (p < 0.56) return 0.48 + easeInOutCubic((p - 0.44) / 0.12) * 0.06;
  return 0.54 + easeOutCubic((p - 0.56) / 0.44) * 0.46;
}

function qs(sel, el = document) {
  const found = el.querySelector(sel);
  if (!found) throw new Error(`Missing element: ${sel}`);
  return found;
}
function qsa(sel, el = document) {
  return Array.from(el.querySelectorAll(sel));
}

function initTopOnReload() {
  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }

  const resetTop = () => window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  const resetTopStrong = () => {
    resetTop();
    window.requestAnimationFrame(() => {
      resetTop();
      window.setTimeout(resetTop, 60);
      window.setTimeout(resetTop, 220);
    });
  };

  window.addEventListener("beforeunload", resetTop);
  window.addEventListener("load", resetTopStrong);
  window.addEventListener("pageshow", resetTopStrong);
  resetTopStrong();
}

function initScrollShift() {
  const shiftZone = qs("[data-shift-zone]");
  const root = document.documentElement;

  let shiftStart = 0;
  let shiftEnd = 1;

  function recalc() {
    shiftStart = shiftZone.offsetTop;
    shiftEnd = shiftStart + shiftZone.offsetHeight - window.innerHeight;
    if (shiftEnd <= shiftStart + 1) shiftEnd = shiftStart + 1;
  }

  function update() {
    const y = window.scrollY || window.pageYOffset;
    const p = clamp((y - shiftStart) / (shiftEnd - shiftStart), 0, 1);
    const v = mapShiftV(p);
    const crack = clamp(1 - Math.abs(p - 0.5) * 2, 0, 1);
    const depth = clamp(easeOutCubic(clamp((v - 0.16) / 0.84, 0, 1)), 0, 1);
    const impactRaw = clamp(1 - Math.abs(p - 0.56) / 0.14, 0, 1);
    const impact = easeOutCubic(impactRaw);

    root.style.setProperty("--p", p.toFixed(4));
    root.style.setProperty("--v", v.toFixed(4));
    root.style.setProperty("--crack", crack.toFixed(4));
    root.style.setProperty("--depth", depth.toFixed(4));
    root.style.setProperty("--impact", impact.toFixed(4));

    const pageProgress = clamp(y / (document.body.scrollHeight - window.innerHeight), 0, 1);
    root.style.setProperty("--scroll", pageProgress.toFixed(4));

    root.dataset.proof = v > 0.6 ? "on" : "off";
  }

  let raf = 0;
  function onScroll() {
    if (raf) return;
    raf = window.requestAnimationFrame(() => {
      raf = 0;
      update();
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", () => {
    recalc();
    update();
  });

  recalc();
  update();
}

function initCTAs() {
  const cta = qs("#ctaScroll");
  const shiftZone = qs("#shift-zone");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const behavior = prefersReducedMotion ? "auto" : "smooth";

  cta.addEventListener("click", () => {
    shiftZone.scrollIntoView({ behavior, block: "start" });
  });

  const restart = qs("#restart");
  restart.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior });
  });
}

function initSectionMotion() {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const revealEase = "cubic-bezier(0.30, 0.00, 0.20, 1.00)";

  const sections = [
    {
      id: "artifacts",
      selectors: [".sectionTitle", ".sectionLede", ".cards .card", ".anchorLine"],
    },
    {
      id: "gap",
      selectors: [".kicker", ".gap__stack .gapLine", ".slackToast", ".anchorLine"],
    },
    {
      id: "shift-zone",
      selectors: [".shift__center"],
    },
    {
      id: "ai-proof",
      selectors: [
        ".sectionHead > div:first-child",
        ".sectionHead .pillNote",
        ".split .legacyLane",
        ".split .protoLab",
      ],
      directional: "split",
    },
    {
      id: "value",
      selectors: [".sectionTitle", ".sectionLede", ".valueGrid .valueCard"],
    },
    {
      id: "closing",
      selectors: [".closing__title", ".closing__lede", ".closing__ctaRow", ".fineprint"],
    },
  ];

  const revealNodes = [];
  const positioned = [];
  for (const sectionDef of sections) {
    const section = document.getElementById(sectionDef.id);
    if (!section) continue;

    const ordered = [];
    for (const sel of sectionDef.selectors) {
      for (const node of qsa(sel, section)) {
        if (!ordered.includes(node)) ordered.push(node);
      }
    }

    ordered.forEach((node, i) => {
      node.classList.add("reveal");
      const sectionSign = sectionDef.id.length % 2 === 0 ? 1 : -1;
      const pairSign = i % 2 === 0 ? 1 : -1;
      const travelX = sectionDef.directional === "split" && i >= 2
        ? 140 * pairSign
        : 62 * sectionSign * pairSign;
      const travelY = 54 - Math.min(i, 3) * 6;

      node.style.setProperty("--rx", `${travelX}px`);
      node.style.setProperty("--ry", `${travelY}px`);
      node.style.setProperty("--rs", i % 3 === 0 ? ".94" : ".96");
      node.style.setProperty("--reveal-duration", `${860 + (i % 2) * 90}ms`);
      node.style.setProperty("--reveal-ease", revealEase);
      revealNodes.push(node);
      positioned.push({ node, top: node.getBoundingClientRect().top + window.scrollY, index: i });
    });
  }

  if (positioned.length > 0) {
    const tops = positioned.map((x) => x.top);
    const minTop = Math.min(...tops);
    const maxTop = Math.max(...tops);
    const span = Math.max(1, maxTop - minTop);

    for (const item of positioned) {
      const yNorm = (item.top - minTop) / span;
      const yDelay = Math.round(30 + yNorm * 420);
      const microStagger = Math.min(140, item.index * 26);
      item.node.style.setProperty("--reveal-delay", `${yDelay + microStagger}ms`);
    }
  }

  if (prefersReducedMotion) {
    revealNodes.forEach((node) => node.classList.add("inview"));
    return;
  }

  if (!("IntersectionObserver" in window)) {
    revealNodes.forEach((node) => node.classList.add("inview"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("inview");
        observer.unobserve(entry.target);
      }
    },
    {
      threshold: 0.18,
      rootMargin: "0px 0px -10% 0px",
    }
  );

  revealNodes.forEach((node) => observer.observe(node));
}

function initIntroAnimation() {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) return;

  const root = document.documentElement;
  root.dataset.intro = "on";
  window.setTimeout(() => {
    root.dataset.intro = "off";
  }, 1700);
}

function mountParticleCustomizer() {
  const stage = document.querySelector("#particleStage");
  if (!stage) return;

  const canvas = qs("#particleCanvas");
  const previewText = qs("#particlePreviewText");
  const textInput = qs("#particleTextInput");
  const playBtn = qs("#particlePlay");
  const form = qs("#particleControls");
  const revealMode = qs("#revealMode");
  const fadeInToggle = qs("#fadeInToggle");
  const overlapAmount = qs("#overlapAmount");

  const textSpeed = qs("#textSpeed");
  const particleSpeed = qs("#particleSpeed");
  const particleDensity = qs("#particleDensity");
  const particleLife = qs("#particleLife");
  const particleSize = qs("#particleSize");
  const particleOpacity = qs("#particleOpacity");

  const overlapVal = qs("#overlapVal");
  const textSpeedVal = qs("#textSpeedVal");
  const particleSpeedVal = qs("#particleSpeedVal");
  const particleDensityVal = qs("#particleDensityVal");
  const particleLifeVal = qs("#particleLifeVal");
  const particleSizeVal = qs("#particleSizeVal");
  const particleOpacityVal = qs("#particleOpacityVal");

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const state = {
    width: 1,
    height: 1,
    dpr: Math.max(1, window.devicePixelRatio || 1),
    text: "From Presentation to Proof",
    progress: 0,
    running: false,
    finished: false,
    startAt: 0,
    lastAt: 0,
    raf: 0,
    spawnCarry: 0,
    particles: [],
    maxParticles: /Mobi|Android/i.test(navigator.userAgent) ? 850 : 1300,
    revealY: 0,
    textFontPx: 62,
    layout: null,
  };

  const config = {
    mode: "letter",
    fadeIn: true,
    overlap: 0.2,
    textSpeed: 1,
    particleSpeed: 1,
    density: 16,
    lifespan: 1100,
    size: 3.5,
    opacity: 0.7,
  };

  // Canvas is the visual renderer; keep this node for accessibility only.
  previewText.style.opacity = "0";
  previewText.setAttribute("aria-hidden", "true");

  function readConfigFromControls() {
    config.mode = revealMode.value;
    config.fadeIn = fadeInToggle.checked;
    config.overlap = Number(overlapAmount.value);
    config.textSpeed = Number(textSpeed.value);
    config.particleSpeed = Number(particleSpeed.value);
    config.density = Number(particleDensity.value);
    config.lifespan = Number(particleLife.value);
    config.size = Number(particleSize.value);
    config.opacity = Number(particleOpacity.value);
  }

  function updateValueReadouts() {
    overlapVal.textContent = `${Math.round(config.overlap * 100)}%`;
    textSpeedVal.textContent = `${config.textSpeed.toFixed(1)}x`;
    particleSpeedVal.textContent = `${config.particleSpeed.toFixed(1)}x`;
    particleDensityVal.textContent = `${config.density}`;
    particleLifeVal.textContent = `${config.lifespan}ms`;
    particleSizeVal.textContent = `${config.size.toFixed(1)}`;
    particleOpacityVal.textContent = config.opacity.toFixed(2);
  }

  function sanitizeText(raw) {
    const cleaned = (raw || "").replace(/\s+/g, " ").trim();
    return cleaned || "From Presentation to Proof";
  }

  function fitTextFont(text) {
    const maxW = state.width * 0.86;
    let fontPx = clamp(state.width * 0.078, 30, 84);
    ctx.save();
    while (fontPx > 24) {
      ctx.font = `700 ${fontPx}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial`;
      if (ctx.measureText(text).width <= maxW) break;
      fontPx -= 1;
    }
    ctx.restore();
    state.textFontPx = fontPx;
  }

  function setTextMetrics() {
    state.revealY = state.height * 0.58;
    fitTextFont(state.text);
  }

  function resizeCanvas() {
    const rect = stage.getBoundingClientRect();
    state.width = Math.max(1, rect.width);
    state.height = Math.max(1, rect.height);
    state.dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.floor(state.width * state.dpr);
    canvas.height = Math.floor(state.height * state.dpr);
    canvas.style.width = `${state.width}px`;
    canvas.style.height = `${state.height}px`;
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    setTextMetrics();
  }

  function textMetrics() {
    ctx.save();
    ctx.font = `700 ${state.textFontPx}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial`;
    const width = ctx.measureText(state.text).width;
    ctx.restore();
    const x = (state.width - width) * 0.5;
    return { x, width };
  }

  function unitParts(text) {
    if (config.mode === "word") {
      return text.match(/\S+\s*|\s+/g) || [text];
    }
    return Array.from(text);
  }

  function buildLayout() {
    const parts = unitParts(state.text);
    const metrics = textMetrics();

    ctx.save();
    ctx.font = `700 ${state.textFontPx}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial`;
    let cursor = metrics.x;
    const units = parts.map((part) => {
      const width = ctx.measureText(part).width;
      const unit = {
        text: part,
        x: cursor,
        width,
        isSpace: /^\s+$/.test(part),
      };
      cursor += width;
      return unit;
    });
    ctx.restore();

    state.layout = {
      x: metrics.x,
      width: metrics.width,
      units,
    };
  }

  function spawnParticles(x, y, amount) {
    if (state.particles.length >= state.maxParticles || amount <= 0) return;

    const spawnCount = Math.min(amount, state.maxParticles - state.particles.length);
    for (let i = 0; i < spawnCount; i += 1) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.2;
      const speed = (34 + Math.random() * 88) * config.particleSpeed;
      const life = config.lifespan * (0.7 + Math.random() * 0.7);
      state.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: config.size * (0.45 + Math.random() * 0.95),
        alpha: config.opacity * (0.6 + Math.random() * 0.5),
        life,
        lifeMax: life,
        hue: 230 + Math.random() * 95,
      });
    }
  }

  function drawBackdrop() {
    const g = ctx.createLinearGradient(0, 0, state.width, state.height);
    g.addColorStop(0, "rgba(255,255,255,0.03)");
    g.addColorStop(1, "rgba(255,255,255,0.0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, state.width, state.height);
  }

  function drawRevealedText(progress) {
    const layout = state.layout || { x: 0, width: 0, units: [] };
    ctx.save();
    ctx.font = `700 ${state.textFontPx}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial`;
    ctx.textBaseline = "middle";

    const ink = ctx.createLinearGradient(
      layout.x,
      state.revealY - state.textFontPx * 0.6,
      layout.x + layout.width,
      state.revealY
    );
    ink.addColorStop(0, "rgba(255,255,255,0.97)");
    ink.addColorStop(0.5, "rgba(237,228,255,0.95)");
    ink.addColorStop(1, "rgba(255,248,237,0.92)");
    ctx.fillStyle = ink;

    const units = layout.units;
    const spacing = 1 - config.overlap;
    const effective = 1 + Math.max(0, units.length - 1) * spacing;
    let leadX = layout.x;

    for (let i = 0; i < units.length; i += 1) {
      const unit = units[i];
      const start = (i * spacing) / effective;
      const end = (i * spacing + 1) / effective;
      const local = clamp((progress - start) / (end - start), 0, 1);
      if (local <= 0) break;

      leadX = unit.x + unit.width * local;

      if (config.fadeIn) {
        ctx.save();
        ctx.globalAlpha = local;
        ctx.fillText(unit.text, unit.x, state.revealY + (1 - local) * 4);
        ctx.restore();
      } else if (local >= 1) {
        ctx.fillText(unit.text, unit.x, state.revealY);
      }
    }

    ctx.restore();

    return { leadX, leadY: state.revealY };
  }

  function stepParticles(dt) {
    const next = [];
    for (const p of state.particles) {
      p.life -= dt;
      if (p.life <= 0) continue;
      const t = p.life / p.lifeMax;
      p.x += (p.vx * dt) / 1000;
      p.y += (p.vy * dt) / 1000;
      p.vy += (30 * config.particleSpeed * dt) / 1000;
      p.vx *= 0.993;

      ctx.fillStyle = `hsla(${p.hue.toFixed(0)}, 95%, 66%, ${(p.alpha * t).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.4, p.size * (0.5 + 0.5 * t)), 0, Math.PI * 2);
      ctx.fill();

      next.push(p);
    }
    state.particles = next;
  }

  function frame(now) {
    const dt = Math.min(42, now - state.lastAt || 16);
    state.lastAt = now;

    const duration = 2600 / config.textSpeed;
    state.progress = clamp((now - state.startAt) / duration, 0, 1);

    ctx.clearRect(0, 0, state.width, state.height);
    drawBackdrop();

    const lead = drawRevealedText(state.progress);

    if (state.progress < 1) {
      state.spawnCarry += (config.density * dt) / 220;
      while (state.spawnCarry >= 1) {
        state.spawnCarry -= 1;
        spawnParticles(lead.leadX, lead.leadY, 1);
      }
      spawnParticles(lead.leadX, lead.leadY, Math.max(1, Math.round(config.density / 9)));
    }

    stepParticles(dt);

    if (state.progress >= 1 && state.particles.length === 0) {
      state.running = false;
      state.finished = true;
      playBtn.disabled = false;
      return;
    }

    state.raf = window.requestAnimationFrame(frame);
  }

  function renderStatic() {
    ctx.clearRect(0, 0, state.width, state.height);
    drawBackdrop();
    drawRevealedText(1);
    state.running = false;
    state.finished = true;
    playBtn.disabled = false;
  }

  function startAnimation() {
    readConfigFromControls();
    updateValueReadouts();

    state.text = sanitizeText(textInput.value);
    textInput.value = state.text;
    setTextMetrics();
    buildLayout();

    if (state.raf) window.cancelAnimationFrame(state.raf);
    state.particles = [];
    state.spawnCarry = 0;
    state.progress = 0;
    state.finished = false;

    if (prefersReducedMotion) {
      renderStatic();
      return;
    }

    playBtn.disabled = true;
    state.running = true;
    state.startAt = performance.now();
    state.lastAt = state.startAt;
    state.raf = window.requestAnimationFrame(frame);
  }

  function onControlInput() {
    readConfigFromControls();
    updateValueReadouts();
  }

  [revealMode, fadeInToggle, overlapAmount, textSpeed, particleSpeed, particleDensity, particleLife, particleSize, particleOpacity].forEach((input) => {
    input.addEventListener("input", onControlInput);
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    startAnimation();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (state.raf) window.cancelAnimationFrame(state.raf);
      state.raf = 0;
    } else if (state.running && !prefersReducedMotion) {
      state.lastAt = performance.now();
      state.raf = window.requestAnimationFrame(frame);
    }
  });

  window.addEventListener("resize", () => {
    resizeCanvas();
    buildLayout();
    if (prefersReducedMotion || !state.running) {
      renderStatic();
    }
  });

  readConfigFromControls();
  updateValueReadouts();
  resizeCanvas();
  buildLayout();
  if (prefersReducedMotion) renderStatic();
  else startAnimation();

  const loopCard = document.querySelector(".legacyLane .videoStub");
  if (loopCard) {
    loopCard.addEventListener("click", () => {
      loopCard.animate(
        [{ transform: "translateY(0px)" }, { transform: "translateY(-2px)" }, { transform: "translateY(0px)" }],
        { duration: 260, easing: "cubic-bezier(.2,.8,.2,1)" }
      );
    });
  }
}

function main() {
  initTopOnReload();
  initIntroAnimation();
  initScrollShift();
  initCTAs();
  initSectionMotion();
  mountParticleCustomizer();
}

window.addEventListener("DOMContentLoaded", main);
