// Vice Cover Lab — the cover engine.
//
// Draws a poster-style multi-panel cover onto a canvas: several photo
// panels in a white-guttered grid, a sunset / neon colour grade, a badge
// ribbon in the top corner, a halftone title block with bold Anton
// lettering and a Pacifico script subtitle, grain and a vignette.
// Everything is drawn, nothing is an image asset: the only photos are the
// ones the person loads (or the four free sample photos the app ships
// with). All lettering and art is original — no Rockstar Games logo,
// artwork, character or font is used anywhere.

// Six layouts. Each entry has a label for the editor and a panels(w, h)
// function returning the panel rects. A panel is { x, y, w, h, rot, slot }:
// rot is a tilt in degrees, slot is which of the four photo slots fills it.
export const LAYOUTS = {
  hero: { label: 'Hero + 3', panels: (w, h) => {
    const g = Math.round(w * 0.012); // white gutter
    const right = w * 0.36;
    return [
      { x: 0, y: 0, w: w - right - g, h, rot: 0, slot: 0 },
      { x: w - right, y: 0, w: right, h: (h - 2 * g) / 3, rot: 0, slot: 1 },
      { x: w - right, y: (h + g) / 3, w: right, h: (h - 2 * g) / 3, rot: 0, slot: 2 },
      { x: w - right, y: (2 * h + g) / 3, w: right, h: (h - 2 * g) / 3, rot: 0, slot: 3 },
    ];
  } },
  grid9: { label: 'Nine-Panel Grid', panels: (w, h) => {
    // 3 x 3 grid; the centre cell is the title block, the other eight are
    // photos cycling through the four slots.
    const g = Math.round(w * 0.012);
    const cw = (w - 2 * g) / 3;
    const ch = (h - 2 * g) / 3;
    const cells = [];
    let slot = 0;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (r === 1 && c === 1) continue; // title block lives here
        cells.push({ x: c * (cw + g), y: r * (ch + g), w: cw, h: ch, rot: 0, slot: slot % 4 });
        slot++;
      }
    }
    return cells;
  } },
  fullbleed: { label: 'Full Bleed', panels: (w, h) => {
    // One photo edge to edge, a strip of three small panels across the top.
    const g = Math.round(w * 0.012);
    const sw = (w - 2 * g) / 3;
    const sh = h * 0.16;
    return [
      { x: 0, y: 0, w, h, rot: 0, slot: 0 },
      { x: 0, y: g, w: sw, h: sh, rot: -1.5, slot: 1 },
      { x: sw + g, y: g, w: sw, h: sh, rot: 0.5, slot: 2 },
      { x: 2 * (sw + g), y: g, w: sw, h: sh, rot: 1.5, slot: 3 },
    ];
  } },
  tilted: { label: 'Tilted Snapshots', panels: (w, h) => {
    // Three polaroid-style snapshots, tilted and overlapping, on a painted
    // sunset sky; the title block sits underneath.
    const pw = w * 0.42;
    const ph = h * 0.52;
    return [
      { x: w * 0.04, y: h * 0.05, w: pw, h: ph, rot: -5, slot: 0 },
      { x: w * 0.30, y: h * 0.02, w: pw, h: ph, rot: 2, slot: 1 },
      { x: w * 0.55, y: h * 0.07, w: pw, h: ph, rot: 5, slot: 2 },
    ];
  } },
  duo: { label: 'Duo Split', panels: (w, h) => {
    // Two large side-by-side panels above the title band: one photo each,
    // split down the middle by the white gutter.
    const g = Math.round(w * 0.012);
    const bh = h * 0.19; // title band height, matched in drawCover
    const pw = (w - g) / 2;
    const ph = h - bh - g;
    return [
      { x: 0, y: 0, w: pw, h: ph, rot: 0, slot: 0 },
      { x: pw + g, y: 0, w: pw, h: ph, rot: 0, slot: 1 },
    ];
  } },
  strip: { label: 'Film Strip', panels: (w, h) => {
    // A horizontal strip of four small panels across the top, one large
    // hero panel underneath, and the title band at the foot.
    const g = Math.round(w * 0.012);
    const bh = h * 0.19;
    const sw = (w - 3 * g) / 4;
    const sh = h * 0.17;
    const heroY = sh + g;
    const heroH = h - bh - heroY - g;
    return [
      { x: 0, y: 0, w: sw, h: sh, rot: 0, slot: 0 },
      { x: sw + g, y: 0, w: sw, h: sh, rot: 0, slot: 1 },
      { x: 2 * (sw + g), y: 0, w: sw, h: sh, rot: 0, slot: 2 },
      { x: 3 * (sw + g), y: 0, w: sw, h: sh, rot: 0, slot: 3 },
      { x: 0, y: heroY, w, h: heroH, rot: 0, slot: 0 },
    ];
  } },
};

// Six colour grades: a canvas filter for the photo, an overlay gradient
// painted over it, and the wash colour for the title block.
export const GRADES = {
  sunset: {
    label: 'Vice Sunset',
    filter: 'saturate(1.35) contrast(1.1) brightness(1.02)',
    overlay: ['rgba(255, 94, 98, 0.28)', 'rgba(255, 153, 51, 0.22)', 'rgba(120, 40, 140, 0.30)'],
    band: ['#2b0a3d', '#7b1e6e', '#ff5e62'],
    accent: '#ffb347',
  },
  neon: {
    label: 'Neon Night',
    filter: 'saturate(1.5) contrast(1.12) hue-rotate(-12deg)',
    overlay: ['rgba(0, 255, 224, 0.20)', 'rgba(255, 0, 153, 0.26)', 'rgba(40, 0, 90, 0.34)'],
    band: ['#0a0626', '#3b0a6e', '#ff2e88'],
    accent: '#00ffe0',
  },
  gold: {
    label: 'Palm Gold',
    filter: 'sepia(0.32) saturate(1.45) contrast(1.06)',
    overlay: ['rgba(255, 190, 60, 0.26)', 'rgba(255, 120, 40, 0.18)', 'rgba(90, 40, 0, 0.22)'],
    band: ['#2a1503', '#7a3c06', '#ffb347'],
    accent: '#ffe08a',
  },
  teal: {
    label: 'Teal Heat',
    filter: 'saturate(1.4) contrast(1.1) hue-rotate(28deg)',
    overlay: ['rgba(0, 220, 200, 0.22)', 'rgba(255, 90, 90, 0.20)', 'rgba(0, 40, 60, 0.30)'],
    band: ['#03252b', '#0a5e6e', '#ff6b6b'],
    accent: '#7dffef',
  },
  bubble: {
    label: 'Bubblegum',
    filter: 'saturate(1.45) contrast(1.05) hue-rotate(-28deg)',
    overlay: ['rgba(255, 110, 199, 0.30)', 'rgba(255, 170, 220, 0.18)', 'rgba(120, 20, 120, 0.28)'],
    band: ['#2b0630', '#8e1e7e', '#ff6ec7'],
    accent: '#ffd6f2',
  },
  mono: {
    label: 'Mono Noir',
    filter: 'grayscale(1) contrast(1.28) brightness(1.06)',
    overlay: ['rgba(255, 255, 255, 0.08)', 'rgba(0, 0, 0, 0.10)', 'rgba(255, 255, 255, 0.06)'],
    band: ['#0d0d0d', '#4a4a4a', '#c8c8c8'],
    accent: '#f2f2f2',
  },
};

export const SIZES = {
  square: { label: 'Square 1080 x 1080', w: 1080, h: 1080 },
  portrait: { label: 'Portrait 1080 x 1350', w: 1080, h: 1350 },
  wide: { label: 'Wide 1920 x 1080', w: 1920, h: 1080 },
  story: { label: 'Story 1080 x 1920', w: 1080, h: 1920 },
};

// The badge ribbon label: an invented place name, drawn as original art.
// It is not a Rockstar wordmark and the ribbon carries no logo.
export const BADGE_LABEL = 'LEONIDA NIGHTS';

// A photo slot: which library photo it shows, and its crop (zoom + pan).
// zoom 1 = cover-fit; x/y are pan offsets in fractions of the panel size.
export function defaultSlots() {
  return [
    { photo: 0, zoom: 1, x: 0, y: 0 },
    { photo: 1, zoom: 1, x: 0, y: 0 },
    { photo: 2, zoom: 1.15, x: 0, y: 0 },
    { photo: 3, zoom: 1.15, x: 0, y: 0 },
  ];
}

// Draws one photo into a panel rect, cover-fit, with the slot's zoom/pan,
// the grade's filter and overlay, and a white inked frame.
function drawPhotoPanel(ctx, img, panel, slot, grade) {
  const { x, y, w, h, rot } = panel;
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  if (rot) ctx.rotate((rot * Math.PI) / 180);
  ctx.translate(-w / 2, -h / 2);
  ctx.beginPath();
  ctx.rect(0, 0, w, h);
  ctx.clip();
  if (img) {
    const base = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const scale = base * slot.zoom;
    const pw = img.naturalWidth * scale;
    const ph = img.naturalHeight * scale;
    const dx = (w - pw) / 2 + slot.x * w;
    const dy = (h - ph) / 2 + slot.y * h;
    ctx.filter = grade.filter;
    ctx.drawImage(img, dx, dy, pw, ph);
    ctx.filter = 'none';
    // Sunset / neon overlay, top to bottom.
    const over = ctx.createLinearGradient(0, 0, 0, h);
    grade.overlay.forEach((c, i) => over.addColorStop(i / (grade.overlay.length - 1), c));
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = over;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
    // A soft shade at the foot so the title band reads over any photo.
    const shade = ctx.createLinearGradient(0, h * 0.55, 0, h);
    shade.addColorStop(0, 'rgba(10, 4, 24, 0)');
    shade.addColorStop(1, 'rgba(10, 4, 24, 0.42)');
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, w, h);
  } else {
    ctx.fillStyle = '#241534';
    ctx.fillRect(0, 0, w, h);
  }
  ctx.restore();
  // Inked white frame, like a printed poster panel.
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  if (rot) ctx.rotate((rot * Math.PI) / 180);
  ctx.translate(-w / 2, -h / 2);
  ctx.lineWidth = Math.max(3, w * 0.008);
  ctx.strokeStyle = '#ffffff';
  ctx.strokeRect(0, 0, w, h);
  ctx.lineWidth = Math.max(1, w * 0.002);
  ctx.strokeStyle = 'rgba(20, 8, 32, 0.85)';
  ctx.strokeRect(ctx.lineWidth * 2, ctx.lineWidth * 2, w - ctx.lineWidth * 4, h - ctx.lineWidth * 4);
  ctx.restore();
}

// Halftone dots across a band: rows of circles that grow toward the band's
// foot, the comic-print texture of a poster title block.
function drawHalftone(ctx, x, y, w, h, color) {
  const step = Math.max(7, w * 0.011);
  ctx.save();
  ctx.fillStyle = color;
  for (let row = 0; row * step < h; row++) {
    for (let col = 0; col * step < w; col++) {
      const r = (step * 0.32 * (row + 1)) / Math.ceil(h / step);
      ctx.beginPath();
      ctx.arc(x + col * step + (row % 2 ? step / 2 : 0), y + row * step, Math.max(0.8, r), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

// Fits `text` in Anton capitals across `maxWidth`, returns the font size.
function fitTitle(ctx, text, maxWidth, startSize) {
  let size = startSize;
  ctx.font = `${size}px Anton, 'Arial Black', sans-serif`;
  while (size > 16 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `${size}px Anton, 'Arial Black', sans-serif`;
  }
  return size;
}

// The title block: a gradient band with halftone, the big title, the neon
// script subtitle, and a five-star heat meter.
function drawTitleBlock(ctx, x, y, w, h, title, subtitle, grade) {
  const band = ctx.createLinearGradient(x, y, x + w, y);
  grade.band.forEach((c, i) => band.addColorStop(i / (grade.band.length - 1), c));
  ctx.fillStyle = band;
  ctx.fillRect(x, y, w, h);
  drawHalftone(ctx, x, y + h * 0.55, w, h * 0.45, 'rgba(255, 255, 255, 0.10)');
  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
  ctx.fillRect(x, y, w, Math.max(3, h * 0.03));

  const text = (title || 'VICE COVER').trim().toUpperCase();
  const size = fitTitle(ctx, text, w * 0.92, h * 0.52);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineWidth = size * 0.14;
  ctx.strokeStyle = '#160a24';
  ctx.strokeText(text, x + w / 2, y + h * 0.36);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, x + w / 2, y + h * 0.36);

  if (subtitle && subtitle.trim()) {
    const subSize = Math.max(14, h * 0.2);
    ctx.font = `${subSize}px Pacifico, cursive`;
    ctx.shadowColor = grade.accent;
    ctx.shadowBlur = subSize * 0.5;
    ctx.fillStyle = grade.accent;
    ctx.fillText(subtitle.trim(), x + w / 2, y + h * 0.74);
    ctx.shadowBlur = 0;
  }

  // Heat meter: five stars, top right of the band — but only when the
  // title leaves room for them, so they never print over the lettering.
  ctx.font = `${size}px Anton, 'Arial Black', sans-serif`;
  const titleWidth = ctx.measureText(text).width;
  if (titleWidth <= w * 0.62) {
    const starSize = Math.max(12, h * 0.13);
    ctx.font = `${starSize}px sans-serif`;
    ctx.fillStyle = grade.accent;
    ctx.textAlign = 'right';
    ctx.fillText('★★★★★', x + w - w * 0.03, y + h * 0.16);
    ctx.textAlign = 'center';
  }
}

// The badge ribbon: a diagonal banner across the top-right corner of the
// cover, with a star and the invented label. Drawn last (before grain) so
// it sits on top of every panel, like a sticker on a printed poster.
export function drawBadgeRibbon(ctx, w, h, grade) {
  const bandH = Math.max(28, w * 0.045);
  const diag = Math.hypot(w, h);
  // The ribbon's centre line crosses the top edge and the right edge the
  // same distance L from the corner, so the band sits diagonally across
  // the corner instead of merely touching it.
  const L = bandH * 4;
  ctx.save();
  ctx.translate(w - L / 2, L / 2);
  ctx.rotate(Math.PI / 4);
  // The ribbon is long enough to cross the corner on any aspect ratio.
  const ribbon = ctx.createLinearGradient(-diag / 2, 0, diag / 2, 0);
  ribbon.addColorStop(0, grade.band[0]);
  ribbon.addColorStop(0.5, grade.band[2]);
  ribbon.addColorStop(1, grade.band[0]);
  ctx.fillStyle = ribbon;
  ctx.fillRect(-diag / 2, -bandH / 2, diag, bandH);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.fillRect(-diag / 2, -bandH / 2, diag, Math.max(2, bandH * 0.06));
  ctx.fillRect(-diag / 2, bandH / 2 - Math.max(2, bandH * 0.06), diag, Math.max(2, bandH * 0.06));
  const fontSize = Math.max(16, bandH * 0.52);
  ctx.font = `${fontSize}px Anton, 'Arial Black', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
  ctx.shadowBlur = fontSize * 0.25;
  ctx.fillText(`★ ${BADGE_LABEL} ★`, 0, 1);
  ctx.restore();
}

// Film grain from a tiny random tile, and a vignette that darkens the rim.
let grainTile = null;
function drawGrainAndVignette(ctx, w, h) {
  if (!grainTile) {
    grainTile = document.createElement('canvas');
    grainTile.width = 128;
    grainTile.height = 128;
    const g = grainTile.getContext('2d');
    const data = g.createImageData(128, 128);
    for (let i = 0; i < data.data.length; i += 4) {
      const v = 118 + Math.floor(Math.random() * 40);
      data.data[i] = v;
      data.data[i + 1] = v;
      data.data[i + 2] = v;
      data.data[i + 3] = 255;
    }
    g.putImageData(data, 0, 0);
  }
  const pattern = ctx.createPattern(grainTile, 'repeat');
  ctx.save();
  ctx.globalAlpha = 0.07;
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
  const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.75);
  vig.addColorStop(0, 'rgba(10, 4, 20, 0)');
  vig.addColorStop(1, 'rgba(10, 4, 20, 0.38)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
}

// The painted sunset sky behind the tilted layout.
function drawSunsetSky(ctx, w, h) {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#1c0b3d');
  sky.addColorStop(0.45, '#7b1e6e');
  sky.addColorStop(0.72, '#ff5e62');
  sky.addColorStop(1, '#ffb347');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  // Sun disc, low on the horizon.
  const sunR = h * 0.13;
  ctx.save();
  ctx.shadowColor = '#ffdf8a';
  ctx.shadowBlur = sunR * 0.9;
  ctx.fillStyle = '#ffe9a8';
  ctx.beginPath();
  ctx.arc(w * 0.5, h * 0.62, sunR, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Palm fronds, faint silhouettes spilling in from the top corners.
  ctx.fillStyle = 'rgba(16, 6, 28, 0.55)';
  for (const [cx, flip] of [[-w * 0.01, 1], [w * 1.01, -1]]) {
    ctx.save();
    ctx.translate(cx, -h * 0.01);
    ctx.scale(flip, 1);
    for (let i = 0; i < 3; i++) {
      ctx.save();
      ctx.rotate(0.55 + i * 0.35);
      ctx.beginPath();
      ctx.ellipse(h * 0.09, 0, h * 0.09, h * 0.012, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }
}

// The full cover. `state` is { layout, grade, title, subtitle, slots,
// badge } and `photos` is the library array (Image or null).
// `opts.selected` draws a dashed selection outline around one panel
// (editor only, never exported).
export function drawCover(canvas, state, photos, opts = {}) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  const grade = GRADES[state.grade] || GRADES.sunset;
  const layout = LAYOUTS[state.layout] || LAYOUTS.hero;
  const panels = layout.panels(w, h);

  // White poster board, then the layout's backdrop.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  if (state.layout === 'tilted') drawSunsetSky(ctx, w, h);

  const g = Math.round(w * 0.012);
  for (const panel of panels) {
    const slot = state.slots[panel.slot] || defaultSlots()[0];
    const img = photos[slot.photo] || null;
    drawPhotoPanel(ctx, img, panel, slot, grade);
  }

  // Title block placement per layout.
  if (state.layout === 'grid9') {
    const cw = (w - 2 * g) / 3;
    const ch = (h - 2 * g) / 3;
    drawTitleBlock(ctx, cw + g, ch + g, cw, ch, state.title, state.subtitle, grade);
  } else if (state.layout === 'tilted') {
    const bh = h * 0.2;
    drawTitleBlock(ctx, 0, h - bh, w, bh, state.title, state.subtitle, grade);
  } else {
    const bh = h * 0.19;
    drawTitleBlock(ctx, 0, h - bh, w, bh, state.title, state.subtitle, grade);
  }

  // Badge ribbon on top of everything (unless the editor turned it off).
  if (state.badge !== false) drawBadgeRibbon(ctx, w, h, grade);

  drawGrainAndVignette(ctx, w, h);

  if (opts.selected != null && panels[opts.selected]) {
    const p = panels[opts.selected];
    ctx.save();
    ctx.setLineDash([14, 10]);
    ctx.lineWidth = Math.max(3, w * 0.004);
    ctx.strokeStyle = '#00ffe0';
    ctx.strokeRect(p.x - 4, p.y - 4, p.w + 8, p.h + 8);
    ctx.restore();
  }
  return panels;
}

// Panel hit-test: which panel (index into the layout's panel list) holds
// the point (px, py) in canvas pixels, or -1.
export function panelAt(state, w, h, px, py) {
  const layout = LAYOUTS[state.layout] || LAYOUTS.hero;
  const panels = layout.panels(w, h);
  for (let i = panels.length - 1; i >= 0; i--) {
    const p = panels[i];
    if (px >= p.x && px <= p.x + p.w && py >= p.y && py <= p.y + p.h) return i;
  }
  return -1;
}
