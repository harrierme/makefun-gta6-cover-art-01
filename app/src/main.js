// Neon Coast Cover Studio — wires the editor page.
//
// Flow: pick photos (yours, from your machine — nothing is uploaded),
// choose a layout, a colour grade and a post size, type the title and
// subtitle, click a panel to select it, drag it to position its photo and
// zoom it, then Export PNG. A `?shot=` query sets up a fixed scene for a
// screenshot instead (./shots.js).

import { drawCover, panelAt, defaultSlots, LAYOUTS, GRADES, SIZES } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const titleInput = document.getElementById('title');
const subtitleInput = document.getElementById('subtitle');
const status = document.getElementById('status');
const zoomInput = document.getElementById('zoom');
const panelPhotoSelect = document.getElementById('panel-photo');
const panelLabel = document.getElementById('panel-label');
const libraryRow = document.getElementById('library');

// The editor state. `slots` holds the four photo slots; each panel of the
// current layout shows one slot. `photos` is the library of loaded images.
export const state = {
  layout: 'hero',
  grade: 'sunset',
  size: 'wide',
  title: 'NEON COAST',
  subtitle: 'chasing the sunset',
  slots: defaultSlots(),
};
export const photos = []; // { img, name }
let selectedPanel = 0;

// Undo / redo: a stack of state snapshots (photos are not snapshotted,
// only which slot shows which photo and its crop).
const undoStack = [];
const redoStack = [];
function snapshot() {
  return JSON.stringify({ layout: state.layout, grade: state.grade, size: state.size,
    title: state.title, subtitle: state.subtitle, slots: state.slots });
}
function restore(json) {
  const s = JSON.parse(json);
  Object.assign(state, s);
  syncControls();
}
function pushHistory() {
  undoStack.push(snapshot());
  if (undoStack.length > 60) undoStack.shift();
  redoStack.length = 0;
  syncHistoryButtons();
}
function undo() {
  if (!undoStack.length) return;
  redoStack.push(snapshot());
  restore(undoStack.pop());
  redraw();
  syncHistoryButtons();
}
function redo() {
  if (!redoStack.length) return;
  undoStack.push(snapshot());
  restore(redoStack.pop());
  redraw();
  syncHistoryButtons();
}
function syncHistoryButtons() {
  document.getElementById('undo').disabled = !undoStack.length;
  document.getElementById('redo').disabled = !redoStack.length;
}

/** Loads an image from a URL, resolving to the image once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

// The preview canvas is drawn at the export size, CSS-scaled to fit.
function redraw() {
  const size = SIZES[state.size];
  if (canvas.width !== size.w || canvas.height !== size.h) {
    canvas.width = size.w;
    canvas.height = size.h;
  }
  drawCover(canvas, state, photos.map((p) => p.img), {
    // The selection outline is editor chrome: never on a cover shot.
    selected: document.body.classList.contains('shot-cover') ? null : selectedPanel,
  });
  document.getElementById('export').textContent = `Export PNG ${size.w} x ${size.h}`;
}

// Builds the option-button rows for layouts, grades and sizes.
function buildOptionRow(el, entries, current, onPick) {
  el.innerHTML = '';
  for (const [key, value] of Object.entries(entries)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'opt' + (key === current ? ' on' : '');
    b.textContent = value.label || value;
    b.dataset.key = key;
    b.addEventListener('click', () => {
      pushHistory();
      onPick(key);
      buildOptionRow(el, entries, key, onPick);
      redraw();
    });
    el.appendChild(b);
  }
}

function syncControls() {
  titleInput.value = state.title;
  subtitleInput.value = state.subtitle;
  zoomInput.value = String(currentSlot().zoom);
  buildOptionRow(document.getElementById('layouts'), LAYOUTS, state.layout, (k) => { state.layout = k; });
  buildOptionRow(document.getElementById('grades'), GRADES, state.grade, (k) => { state.grade = k; });
  buildOptionRow(document.getElementById('sizes'), SIZES, state.size, (k) => { state.size = k; });
  syncPanelControls();
}

function currentSlot() {
  const panels = drawCoverPanels();
  const panel = panels[selectedPanel] || panels[0];
  return state.slots[panel ? panel.slot : 0];
}
function drawCoverPanels() {
  // Panel rects for the current layout at the preview size.
  return LAYOUTS[state.layout].panels(canvas.width, canvas.height);
}

function syncPanelControls() {
  const panels = drawCoverPanels();
  const panel = panels[selectedPanel] || panels[0];
  const slotIndex = panel ? panel.slot : 0;
  panelLabel.textContent = `Panel ${selectedPanel + 1} of ${panels.length} — slot ${slotIndex + 1}`;
  panelPhotoSelect.innerHTML = '';
  photos.forEach((p, i) => {
    const o = document.createElement('option');
    o.value = String(i);
    o.textContent = p.name;
    if (state.slots[slotIndex].photo === i) o.selected = true;
    panelPhotoSelect.appendChild(o);
  });
  zoomInput.value = String(state.slots[slotIndex].zoom);
}

// The photo library strip: thumbnails of every loaded photo; clicking one
// fills all four slots with it.
function renderLibrary() {
  libraryRow.innerHTML = '';
  photos.forEach((p, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'thumb';
    b.title = `${p.name} — click to fill all panels`;
    const thumb = document.createElement('img');
    thumb.src = p.img.src;
    thumb.alt = p.name;
    b.appendChild(thumb);
    b.addEventListener('click', () => {
      pushHistory();
      state.slots.forEach((s) => { s.photo = i; s.zoom = 1; s.x = 0; s.y = 0; });
      syncPanelControls();
      redraw();
    });
    libraryRow.appendChild(b);
  });
  syncPanelControls();
}

async function addPhotoFile(file) {
  const img = await loadImage(URL.createObjectURL(file));
  photos.push({ img, name: file.name.replace(/\.[^.]+$/, '') });
  renderLibrary();
  redraw();
  return photos.length - 1;
}

document.getElementById('photos').addEventListener('change', async (e) => {
  for (const file of e.target.files) {
    // eslint-disable-next-line no-await-in-loop
    await addPhotoFile(file);
  }
  status.textContent = `${photos.length} photo${photos.length === 1 ? '' : 's'} loaded — click a panel, drag to position it.`;
  e.target.value = '';
});

titleInput.addEventListener('input', () => { state.title = titleInput.value; redraw(); });
subtitleInput.addEventListener('input', () => { state.subtitle = subtitleInput.value; redraw(); });
// Snapshot before the first keystroke / slider move, so Undo restores the
// state from before the edit, not after it.
for (const el of [titleInput, subtitleInput, zoomInput]) {
  el.addEventListener('focus', pushHistory, { once: false });
  el.addEventListener('pointerdown', pushHistory, { once: false });
}

panelPhotoSelect.addEventListener('change', () => {
  pushHistory();
  currentSlot().photo = Number(panelPhotoSelect.value);
  redraw();
});
zoomInput.addEventListener('input', () => {
  currentSlot().zoom = Number(zoomInput.value);
  redraw();
});
document.getElementById('center-panel').addEventListener('click', () => {
  pushHistory();
  const s = currentSlot();
  s.x = 0;
  s.y = 0;
  s.zoom = 1;
  syncPanelControls();
  redraw();
});
document.getElementById('undo').addEventListener('click', undo);
document.getElementById('redo').addEventListener('click', redo);

// Click a panel to select it; drag to pan its photo.
let drag = null;
function canvasPoint(e) {
  const r = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - r.left) / r.width) * canvas.width,
    y: ((e.clientY - r.top) / r.height) * canvas.height,
  };
}
canvas.addEventListener('pointerdown', (e) => {
  const p = canvasPoint(e);
  const hit = panelAt(state, canvas.width, canvas.height, p.x, p.y);
  if (hit < 0) return;
  selectedPanel = hit;
  const slot = currentSlot();
  // Snapshot before the drag, so Undo restores the pre-drag crop.
  pushHistory();
  drag = { x: p.x, y: p.y, slotX: slot.x, slotY: slot.y, moved: false };
  canvas.setPointerCapture(e.pointerId);
  syncPanelControls();
  redraw();
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const p = canvasPoint(e);
  const slot = currentSlot();
  const dx = (p.x - drag.x) / canvas.width;
  const dy = (p.y - drag.y) / canvas.height;
  if (Math.abs(dx) + Math.abs(dy) > 0.002) drag.moved = true;
  slot.x = drag.slotX + dx;
  slot.y = drag.slotY + dy;
  redraw();
});
canvas.addEventListener('pointerup', () => {
  drag = null;
});

// Export: render the cover at full size with no selection outline and
// download it as a PNG.
document.getElementById('export').addEventListener('click', () => {
  const size = SIZES[state.size];
  const off = document.createElement('canvas');
  off.width = size.w;
  off.height = size.h;
  drawCover(off, state, photos.map((p) => p.img));
  off.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `neon-coast-cover-${size.w}x${size.h}.png`;
    a.click();
    status.textContent = `Saved neon-coast-cover-${size.w}x${size.h}.png — share it.`;
  }, 'image/png');
});

// Fonts first: Anton for the title, Pacifico for the subtitle, Bebas Neue
// for the editor chrome. Redraw once they arrive so the cover never shows
// a fallback face.
async function loadFonts() {
  try {
    await Promise.all([
      document.fonts.load('90px Anton'),
      document.fonts.load('40px Pacifico'),
      document.fonts.load('700 20px "Bebas Neue"'),
    ]);
  } catch { /* fallback faces still draw */ }
  redraw();
}

// Boot: the two free sample photos are already in the library, so the
// first thing a person sees is a finished cover, not an empty page.
const shot = new URLSearchParams(location.search).get('shot');
async function boot() {
  await loadFonts();
  if (shot) {
    await runShot(shot, new URLSearchParams(location.search), {
      state, photos, addPhotoFile, redraw, syncControls, renderLibrary, loadImage,
      selectPanel: (i) => { selectedPanel = i; },
    });
  } else {
    const [boulevard, pier] = await Promise.all([
      loadImage('samples/boulevard.jpg'),
      loadImage('samples/pier.jpg'),
    ]);
    photos.push({ img: boulevard, name: 'Boulevard' }, { img: pier, name: 'Pier' });
    renderLibrary();
    syncControls();
    redraw();
  }
}
boot();
