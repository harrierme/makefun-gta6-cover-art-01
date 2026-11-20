// Vice Cover Lab — the editor.
// Wires the photo library, the layouts, the grades and the caption inputs to
// a live canvas preview, and exports PNGs in the post sizes. Photos never
// leave the machine: library photos are files under app/, uploads are read
// with FileReader and kept in memory only.

import { SIZES, LAYOUTS, GRADES, drawCover, renderCover, panelAt, layoutById, gradeById, sizeById } from './cover.js';
import { library, loadAllPhotos, addUpload } from './photos.js';

const $ = (id) => document.getElementById(id);

const PREVIEW_LONG = 640;

function defaultPanels(layoutId) {
  const layout = layoutById(layoutId);
  const order = ['boulevard', 'rooftop', 'neon', 'pier'];
  return layout.panels.map((_, i) => ({
    photo: order[i % order.length],
    zoom: 1,
    fx: 0.5,
    fy: 0.5,
  }));
}

function defaultState() {
  return {
    layoutId: 'hero-split',
    gradeId: 'vice-sunset',
    title: 'LEONIDA NIGHTS',
    subtitle: 'Vice City, 2026',
    sizeId: 'story',
    panels: defaultPanels('hero-split'),
  };
}

let state = defaultState();
let images = new Map();
let selected = 0;
let undoStack = [];
let redoStack = [];
let dragging = null;

/** A snapshot of the state, for undo/redo. */
function snapshot() {
  return JSON.parse(JSON.stringify(state));
}

/** Pushes the current state before a change, and clears the redo stack. */
function commit() {
  undoStack.push(snapshot());
  if (undoStack.length > 60) undoStack.shift();
  redoStack = [];
  updateHistoryButtons();
}

function undo() {
  if (undoStack.length === 0) return;
  redoStack.push(snapshot());
  state = undoStack.pop();
  selected = Math.min(selected, state.panels.length - 1);
  syncControls();
  render();
  updateHistoryButtons();
}

function redo() {
  if (redoStack.length === 0) return;
  undoStack.push(snapshot());
  state = redoStack.pop();
  selected = Math.min(selected, state.panels.length - 1);
  syncControls();
  render();
  updateHistoryButtons();
}

function updateHistoryButtons() {
  $('undoBtn').disabled = undoStack.length === 0;
  $('redoBtn').disabled = redoStack.length === 0;
}

/** The preview size for the current export size, long side capped. */
function previewSize() {
  const size = sizeById(state.sizeId);
  const scale = PREVIEW_LONG / Math.max(size.w, size.h);
  return { w: Math.round(size.w * scale), h: Math.round(size.h * scale) };
}

function render() {
  const canvas = $('preview');
  const { w, h } = previewSize();
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  drawCover(ctx, w, h, state, images);
  // Outline the selected panel so the user sees which one they edit.
  const layout = layoutById(state.layoutId);
  const p = layout.panels[selected];
  if (p) {
    ctx.save();
    ctx.strokeStyle = '#ff7a1a';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 6]);
    ctx.strokeRect(p.x * w + 2, p.y * h + 2, p.w * w - 4, p.h * h - 4);
    ctx.restore();
  }
  const slot = state.panels[selected];
  const photo = library.find((x) => x.id === slot?.photo);
  $('selectedLabel').textContent = slot
    ? `Panel ${selected + 1} — ${photo ? photo.label : slot.photo} · zoom ${slot.zoom.toFixed(2)}`
    : 'No panel selected';
}

function syncControls() {
  $('titleInput').value = state.title;
  $('subtitleInput').value = state.subtitle;
  document.querySelectorAll('#layoutRow button').forEach((b) => {
    b.classList.toggle('active', b.dataset.id === state.layoutId);
  });
  document.querySelectorAll('#gradeRow button').forEach((b) => {
    b.classList.toggle('active', b.dataset.id === state.gradeId);
  });
  document.querySelectorAll('#sizeRow button').forEach((b) => {
    b.classList.toggle('active', b.dataset.id === state.sizeId);
  });
  const slot = state.panels[selected];
  if (slot) $('zoomRange').value = String(slot.zoom);
}

function buildButtons() {
  const layoutRow = $('layoutRow');
  for (const layout of LAYOUTS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.id = layout.id;
    b.textContent = layout.name;
    b.addEventListener('click', () => {
      if (state.layoutId === layout.id) return;
      commit();
      state.layoutId = layout.id;
      state.panels = defaultPanels(layout.id);
      selected = 0;
      syncControls();
      render();
    });
    layoutRow.appendChild(b);
  }
  const gradeRow = $('gradeRow');
  for (const grade of GRADES) {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.id = grade.id;
    b.textContent = grade.name;
    b.addEventListener('click', () => {
      if (state.gradeId === grade.id) return;
      commit();
      state.gradeId = grade.id;
      syncControls();
      render();
    });
    gradeRow.appendChild(b);
  }
  const sizeRow = $('sizeRow');
  for (const size of SIZES) {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.id = size.id;
    b.textContent = size.name;
    b.addEventListener('click', () => {
      if (state.sizeId === size.id) return;
      commit();
      state.sizeId = size.id;
      syncControls();
      render();
    });
    sizeRow.appendChild(b);
  }
}

function buildPhotoStrip() {
  const strip = $('photoStrip');
  strip.innerHTML = '';
  for (const photo of library) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'photo-thumb';
    b.dataset.id = photo.id;
    b.title = `${photo.label} — ${photo.note}`;
    const img = document.createElement('img');
    img.src = photo.src;
    img.alt = photo.label;
    const span = document.createElement('span');
    span.textContent = photo.label;
    b.append(img, span);
    b.addEventListener('click', () => {
      commit();
      state.panels[selected] = { ...state.panels[selected], photo: photo.id };
      render();
    });
    strip.appendChild(b);
  }
}

/** The drawn size of a photo inside a panel rect, at a zoom, in cover pixels. */
function photoDrawSize(img, rect, zoom) {
  const scale = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight) * zoom;
  return { dw: img.naturalWidth * scale, dh: img.naturalHeight * scale };
}

function previewPoint(evt) {
  const canvas = $('preview');
  const box = canvas.getBoundingClientRect();
  return {
    x: ((evt.clientX - box.left) / box.width) * canvas.width,
    y: ((evt.clientY - box.top) / box.height) * canvas.height,
  };
}

function wirePreview() {
  const canvas = $('preview');
  canvas.addEventListener('pointerdown', (evt) => {
    const pt = previewPoint(evt);
    const idx = panelAt(state.layoutId, canvas.width, canvas.height, pt.x, pt.y);
    if (idx < 0) return;
    selected = idx;
    commit();
    const layout = layoutById(state.layoutId);
    const p = layout.panels[idx];
    const rect = { x: p.x * canvas.width, y: p.y * canvas.height, w: p.w * canvas.width, h: p.h * canvas.height };
    const slot = state.panels[idx];
    const img = images.get(slot.photo);
    const { dw, dh } = img ? photoDrawSize(img, rect, slot.zoom) : { dw: rect.w, dh: rect.h };
    dragging = { lastX: pt.x, lastY: pt.y, dw, dh };
    canvas.setPointerCapture(evt.pointerId);
    render();
  });
  canvas.addEventListener('pointermove', (evt) => {
    if (!dragging) return;
    const pt = previewPoint(evt);
    const dx = pt.x - dragging.lastX;
    const dy = pt.y - dragging.lastY;
    dragging.lastX = pt.x;
    dragging.lastY = pt.y;
    const slot = state.panels[selected];
    slot.fx = Math.min(1, Math.max(0, slot.fx - dx / dragging.dw));
    slot.fy = Math.min(1, Math.max(0, slot.fy - dy / dragging.dh));
    render();
  });
  const endDrag = () => {
    dragging = null;
  };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
}

function download(canvas, filename) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        resolve();
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      resolve();
    }, 'image/png');
  });
}

async function exportSize(sizeId) {
  const size = sizeById(sizeId);
  const canvas = renderCover(size.w, size.h, state, images);
  await download(canvas, `vice-cover-lab-${sizeId}.png`);
}

async function exportAll() {
  const btn = $('exportAllBtn');
  btn.disabled = true;
  btn.textContent = 'Exporting…';
  for (const size of SIZES) {
    await exportSize(size.id);
    await new Promise((r) => setTimeout(r, 400));
  }
  btn.disabled = false;
  btn.textContent = 'Export all 4 sizes';
}

/** A full-frame cover for a screenshot scene (?shot=cover|square|wide). */
function shotScene(name) {
  const scenes = {
    cover: { sizeId: 'story', layoutId: 'hero-split', gradeId: 'vice-sunset', title: 'LEONIDA NIGHTS', subtitle: 'Vice City, 2026' },
    square: { sizeId: 'square', layoutId: 'four-grid', gradeId: 'neon-nights', title: 'NEON SHORE', subtitle: 'After dark in Vice City' },
    wide: { sizeId: 'wide', layoutId: 'hero-left', gradeId: 'golden-hour', title: 'GOLDEN COAST', subtitle: 'Sunset on the boulevard' },
  };
  return scenes[name] ?? null;
}

async function runShotScene(name) {
  const scene = shotScene(name);
  if (!scene) return false;
  document.body.classList.add('shot-mode');
  const canvas = $('shotCanvas');
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = w;
  canvas.height = h;
  const shotState = {
    layoutId: scene.layoutId,
    gradeId: scene.gradeId,
    title: scene.title,
    subtitle: scene.subtitle,
    panels: defaultPanels(scene.layoutId),
  };
  const ctx = canvas.getContext('2d');
  drawCover(ctx, w, h, shotState, images);
  document.title = `Vice Cover Lab — ${name}`;
  return true;
}

function wireControls() {
  $('titleInput').addEventListener('input', (evt) => {
    state.title = evt.target.value;
    render();
  });
  $('titleInput').addEventListener('change', commit);
  $('subtitleInput').addEventListener('input', (evt) => {
    state.subtitle = evt.target.value;
    render();
  });
  $('subtitleInput').addEventListener('change', commit);
  $('zoomRange').addEventListener('input', (evt) => {
    const slot = state.panels[selected];
    if (!slot) return;
    slot.zoom = Number(evt.target.value);
    render();
  });
  $('zoomRange').addEventListener('change', commit);
  $('centerBtn').addEventListener('click', () => {
    const slot = state.panels[selected];
    if (!slot) return;
    commit();
    slot.fx = 0.5;
    slot.fy = 0.5;
    slot.zoom = 1;
    syncControls();
    render();
  });
  $('undoBtn').addEventListener('click', undo);
  $('redoBtn').addEventListener('click', redo);
  $('exportOneBtn').addEventListener('click', () => exportSize(state.sizeId));
  $('exportAllBtn').addEventListener('click', exportAll);
  $('uploadBtn').addEventListener('click', () => $('fileInput').click());
  $('fileInput').addEventListener('change', (evt) => {
    const file = evt.target.files && evt.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const id = addUpload(String(reader.result), file.name.replace(/\.[^.]+$/, '') || 'Your photo');
      buildPhotoStrip();
      commit();
      state.panels[selected] = { ...state.panels[selected], photo: id };
      render();
    };
    reader.readAsDataURL(file);
    evt.target.value = '';
  });
}

async function init() {
  buildButtons();
  buildPhotoStrip();
  wirePreview();
  wireControls();
  syncControls();
  updateHistoryButtons();
  images = await loadAllPhotos();
  // The lettering fonts must be in before the first paint, or the cover
  // draws with a fallback face. Anton and Pacifico are vendored under app/.
  if (document.fonts) {
    try {
      await Promise.all([
        document.fonts.load('64px Anton'),
        document.fonts.load('32px Pacifico'),
        document.fonts.ready,
      ]);
    } catch {
      // A fallback face still draws; the export stays valid.
    }
  }
  const shot = new URLSearchParams(location.search).get('shot');
  if (shot && (await runShotScene(shot))) return;
  render();
}

init().catch((err) => {
  const note = $('loadError');
  if (note) note.textContent = `Could not start the editor: ${err.message}`;
  console.error(err);
});
