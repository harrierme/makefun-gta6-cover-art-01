// Vice Cover Lab — cover rendering engine.
// Draws GTA-style multi-panel cover art onto a 2D canvas: panels, colour
// grades, the badge ribbon, the title block and the frame. Pure canvas, no
// dependencies, no network. The same drawCover drives the live preview and
// every exported PNG, so what you see is what you share.

export const SIZES = [
  { id: 'story', name: 'Story 1080 × 1920', w: 1080, h: 1920 },
  { id: 'square', name: 'Square 1080 × 1080', w: 1080, h: 1080 },
  { id: 'portrait', name: 'Portrait 1080 × 1350', w: 1080, h: 1350 },
  { id: 'wide', name: 'Wide 1920 × 1080', w: 1920, h: 1080 },
];

export const LAYOUTS = [
  {
    id: 'hero-split',
    name: 'Hero Split',
    panels: [
      { x: 0, y: 0, w: 1, h: 0.6 },
      { x: 0, y: 0.6, w: 0.5, h: 0.4 },
      { x: 0.5, y: 0.6, w: 0.5, h: 0.4 },
    ],
  },
  {
    id: 'four-grid',
    name: 'Four Grid',
    panels: [
      { x: 0, y: 0, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0, w: 0.5, h: 0.5 },
      { x: 0, y: 0.5, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
    ],
  },
  {
    id: 'hero-left',
    name: 'Hero Left',
    panels: [
      { x: 0, y: 0, w: 0.6, h: 1 },
      { x: 0.6, y: 0, w: 0.4, h: 0.5 },
      { x: 0.6, y: 0.5, w: 0.4, h: 0.5 },
    ],
  },
  {
    id: 'hero-top',
    name: 'Hero Top',
    panels: [
      { x: 0, y: 0, w: 1, h: 0.58 },
      { x: 0, y: 0.58, w: 1 / 3, h: 0.42 },
      { x: 1 / 3, y: 0.58, w: 1 / 3, h: 0.42 },
      { x: 2 / 3, y: 0.58, w: 1 / 3, h: 0.42 },
    ],
  },
  {
    id: 'full-bleed',
    name: 'Full Bleed',
    panels: [{ x: 0, y: 0, w: 1, h: 1 }],
  },
  {
    id: 'tilted-trio',
    name: 'Tilted Trio',
    panels: [
      { x: 0.05, y: 0.05, w: 0.6, h: 0.46, rot: -3 },
      { x: 0.38, y: 0.34, w: 0.6, h: 0.46, rot: 2 },
      { x: 0.06, y: 0.66, w: 0.62, h: 0.3, rot: -1.5 },
    ],
  },
];

export const GRADES = [
  {
    id: 'vice-sunset',
    name: 'Vice Sunset',
    filter: 'saturate(1.30) contrast(1.10) brightness(1.02)',
    top: '#ff9a3d',
    bottom: '#d6336c',
    mode: 'soft-light',
    opacity: 0.55,
    vignette: 0.35,
  },
  {
    id: 'neon-nights',
    name: 'Neon Nights',
    filter: 'saturate(1.45) contrast(1.15) brightness(0.95)',
    top: '#ff2d78',
    bottom: '#0e7490',
    mode: 'overlay',
    opacity: 0.5,
    vignette: 0.45,
  },
  {
    id: 'golden-hour',
    name: 'Golden Hour',
    filter: 'saturate(1.20) contrast(1.05) brightness(1.06) sepia(0.18)',
    top: '#ffb347',
    bottom: '#ff7a1a',
    mode: 'soft-light',
    opacity: 0.45,
    vignette: 0.3,
  },
  {
    id: 'noir-teal',
    name: 'Noir Teal',
    filter: 'saturate(0.75) contrast(1.20) brightness(0.92)',
    top: '#0f766e',
    bottom: '#111827',
    mode: 'overlay',
    opacity: 0.5,
    vignette: 0.5,
  },
  {
    id: 'palm-pop',
    name: 'Palm Pop',
    filter: 'saturate(1.60) contrast(1.12) brightness(1.00)',
    top: '#f472b6',
    bottom: '#22d3ee',
    mode: 'soft-light',
    opacity: 0.35,
    vignette: 0.3,
  },
  {
    id: 'mono-warm',
    name: 'Mono Warm',
    filter: 'grayscale(1) contrast(1.15) brightness(1.03)',
    top: '#d6a05a',
    bottom: '#8a6d4b',
    mode: 'soft-light',
    opacity: 0.3,
    vignette: 0.4,
  },
];

export const BADGE_TEXT = '★ LEONIDA NIGHTS ★';

/** A small deterministic RNG so the grain is identical on every render. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

/**
 * Draws `img` into `rect` with a cover fit, scaled by `zoom`, with the
 * image point (fx, fy) — each 0..1 — placed at the rect's centre. The focal
 * point is clamped so the photo always covers the whole rect.
 */
function drawPhotoInto(ctx, img, rect, zoom, fx, fy) {
  const scale = Math.max(rect.w / img.width, rect.h / img.height) * zoom;
  const dw = img.width * scale;
  const dh = img.height * scale;
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  const fxLo = rect.w / 2 / dw;
  const fxHi = (dw - rect.w / 2) / dw;
  const fyLo = rect.h / 2 / dh;
  const fyHi = (dh - rect.h / 2) / dh;
  const px = clamp(fx, fxLo, fxHi);
  const py = clamp(fy, fyLo, fyHi);
  ctx.drawImage(img, cx - px * dw, cy - py * dh, dw, dh);
}

/** One panel: the photo (or a placeholder), clipped to its rect, with a border. */
function drawPanel(ctx, img, rect, slot, grade, gap, rotDeg, tilted) {
  const inset = gap / 2;
  const r = { x: rect.x + inset, y: rect.y + inset, w: rect.w - gap, h: rect.h - gap };
  ctx.save();
  if (rotDeg) {
    ctx.translate(r.x + r.w / 2, r.y + r.h / 2);
    ctx.rotate((rotDeg * Math.PI) / 180);
    ctx.translate(-(r.x + r.w / 2), -(r.y + r.h / 2));
  }
  ctx.beginPath();
  ctx.rect(r.x, r.y, r.w, r.h);
  ctx.clip();
  if (img) {
    ctx.filter = grade.filter;
    drawPhotoInto(ctx, img, r, slot.zoom, slot.fx, slot.fy);
    ctx.filter = 'none';
  } else {
    ctx.fillStyle = '#2a211c';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.fillStyle = 'rgba(245, 234, 217, 0.6)';
    ctx.font = `600 ${Math.round(r.h * 0.05)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Add a photo', r.x + r.w / 2, r.y + r.h / 2);
  }
  ctx.restore();
  // Border, drawn in the panel's own (possibly rotated) space.
  ctx.save();
  if (rotDeg) {
    ctx.translate(r.x + r.w / 2, r.y + r.h / 2);
    ctx.rotate((rotDeg * Math.PI) / 180);
    ctx.translate(-(r.x + r.w / 2), -(r.y + r.h / 2));
  }
  ctx.lineWidth = tilted ? Math.max(6, Math.min(r.w, r.h) * 0.03) : Math.max(2, Math.min(r.w, r.h) * 0.006);
  ctx.strokeStyle = tilted ? '#fff8ec' : 'rgba(255, 243, 224, 0.9)';
  ctx.strokeRect(r.x, r.y, r.w, r.h);
  ctx.restore();
}

/** The grade's colour wash, vignette and grain over the whole cover. */
function applyGradeOverlay(ctx, W, H, grade) {
  ctx.save();
  ctx.globalCompositeOperation = grade.mode;
  ctx.globalAlpha = grade.opacity;
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, grade.top);
  g.addColorStop(1, grade.bottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  // Vignette: darkened corners so the middle holds the eye.
  const v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, `rgba(10,5,8,${grade.vignette})`);
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, W, H);
  // Grain: a fixed-seed speckle, the same on every render.
  const rand = mulberry32(20261119);
  const dots = Math.round((W * H) / 900);
  ctx.save();
  for (let i = 0; i < dots; i++) {
    const light = rand() > 0.5;
    ctx.fillStyle = light ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
    ctx.fillRect(rand() * W, rand() * H, 1.5, 1.5);
  }
  ctx.restore();
}

/** The badge ribbon across the top of the cover. */
function drawBadgeRibbon(ctx, W, H) {
  const bw = W * 0.74;
  const bh = Math.max(28, H * 0.042);
  const cx = W / 2;
  const cy = H * 0.075;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((-2 * Math.PI) / 180);
  ctx.fillStyle = '#ff2d78';
  ctx.fillRect(-bw / 2, -bh / 2, bw, bh);
  ctx.lineWidth = Math.max(2, bh * 0.06);
  ctx.strokeStyle = '#fff3e0';
  ctx.strokeRect(-bw / 2, -bh / 2, bw, bh);
  ctx.fillStyle = '#fff3e0';
  ctx.font = `${Math.round(bh * 0.58)}px Anton, 'Arial Black', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(BADGE_TEXT, 0, bh * 0.04);
  ctx.restore();
}

/** The title band at the bottom: a dark gradient, the title and the subtitle. */
function drawTitleBlock(ctx, W, H, title, subtitle) {
  // Dark band so the lettering reads over any photo.
  const bandTop = H * 0.6;
  const band = ctx.createLinearGradient(0, bandTop, 0, H);
  band.addColorStop(0, 'rgba(12,6,8,0)');
  band.addColorStop(0.55, 'rgba(12,6,8,0.55)');
  band.addColorStop(1, 'rgba(12,6,8,0.82)');
  ctx.fillStyle = band;
  ctx.fillRect(0, bandTop, W, H - bandTop);

  const maxW = W * 0.92;
  const words = (title || 'LEONIDA').toUpperCase();
  let size = Math.round(W * 0.115);
  ctx.font = `${size}px Anton, 'Arial Black', sans-serif`;
  while (size > 24 && ctx.measureText(words).width > maxW) {
    size = Math.round(size * 0.94);
    ctx.font = `${size}px Anton, 'Arial Black', sans-serif`;
  }
  const titleY = H * 0.86;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = Math.max(3, size * 0.09);
  ctx.strokeStyle = '#1a0f0a';
  ctx.lineJoin = 'round';
  ctx.strokeText(words, W / 2, titleY);
  ctx.fillStyle = '#fff3e0';
  ctx.fillText(words, W / 2, titleY);

  if (subtitle) {
    const subSize = Math.round(W * 0.042);
    ctx.font = `${subSize}px Pacifico, cursive`;
    ctx.fillStyle = '#ff8fb8';
    ctx.fillText(subtitle, W / 2, titleY + size * 0.62 + subSize * 0.5);
  }
}

/** A thin cream frame inset from the edge. */
function drawFrame(ctx, W, H) {
  const inset = Math.max(10, Math.min(W, H) * 0.014);
  ctx.lineWidth = Math.max(3, Math.min(W, H) * 0.006);
  ctx.strokeStyle = 'rgba(255, 243, 224, 0.9)';
  ctx.strokeRect(inset, inset, W - inset * 2, H - inset * 2);
}

export function layoutById(id) {
  return LAYOUTS.find((l) => l.id === id) ?? LAYOUTS[0];
}

export function gradeById(id) {
  return GRADES.find((g) => g.id === id) ?? GRADES[0];
}

export function sizeById(id) {
  return SIZES.find((s) => s.id === id) ?? SIZES[0];
}

/**
 * Draws the whole cover onto `ctx` at W×H.
 * state: { layoutId, gradeId, title, subtitle, panels: [{ photo, zoom, fx, fy }] }
 * images: a Map from photo id to a loaded HTMLImageElement.
 */
export function drawCover(ctx, W, H, state, images) {
  const layout = layoutById(state.layoutId);
  const grade = gradeById(state.gradeId);
  const tilted = layout.id === 'tilted-trio';
  ctx.save();
  ctx.fillStyle = '#171310';
  ctx.fillRect(0, 0, W, H);
  const gap = Math.round(Math.min(W, H) * 0.008);
  layout.panels.forEach((p, i) => {
    const slot = state.panels[i] ?? { photo: 'boulevard', zoom: 1, fx: 0.5, fy: 0.5 };
    const img = images.get(slot.photo) ?? null;
    const rect = { x: p.x * W, y: p.y * H, w: p.w * W, h: p.h * H };
    drawPanel(ctx, img, rect, slot, grade, gap, p.rot ?? 0, tilted);
  });
  applyGradeOverlay(ctx, W, H, grade);
  drawBadgeRibbon(ctx, W, H);
  drawTitleBlock(ctx, W, H, state.title, state.subtitle);
  drawFrame(ctx, W, H);
  ctx.restore();
}

/** Renders the cover onto a fresh canvas at W×H and returns it. */
export function renderCover(W, H, state, images) {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  drawCover(ctx, W, H, state, images);
  return canvas;
}

/**
 * Which panel of `layoutId` contains the point (px, py) in a W×H cover,
 * or -1. Used to select a panel by clicking the preview.
 */
export function panelAt(layoutId, W, H, px, py) {
  const layout = layoutById(layoutId);
  for (let i = layout.panels.length - 1; i >= 0; i--) {
    const p = layout.panels[i];
    const r = { x: p.x * W, y: p.y * H, w: p.w * W, h: p.h * H };
    if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) return i;
  }
  return -1;
}
