// Fixed scenes for screenshots: ?shot=editor shows the page with sample
// photos loaded; ?shot=cover shows one exported cover alone, drawn by the
// app itself at the export size. window.__shotReady is set once painted.
//
// Query knobs: layout, grade, size (square|portrait|wide), title,
// subtitle, photo (the sample each slot starts from: boulevard|pier).
import { SIZES } from './cover.js';

const SAMPLES = {
  boulevard: 'samples/boulevard.jpg',
  pier: 'samples/pier.jpg',
};

export async function runShot(shot, query, api) {
  const { state, photos, redraw, syncControls, renderLibrary, loadImage } = api;
  const canvas = document.getElementById('cover');
  state.layout = query.get('layout') || 'hero';
  state.grade = query.get('grade') || 'sunset';
  state.size = query.get('size') || 'wide';
  state.title = query.get('title') || 'NEON COAST';
  state.subtitle = query.get('subtitle') || 'chasing the sunset';

  const first = query.get('photo') || 'boulevard';
  const second = first === 'boulevard' ? 'pier' : 'boulevard';
  const [imgA, imgB] = await Promise.all([
    loadImage(SAMPLES[first]),
    loadImage(SAMPLES[second]),
  ]);
  photos.push({ img: imgA, name: first }, { img: imgB, name: second });
  // Slots 0 and 2 show the first photo, 1 and 3 the second, at different
  // crops, so every panel of every layout is filled.
  state.slots[0].photo = 0;
  state.slots[1].photo = 1;
  state.slots[2].photo = 0;
  state.slots[3].photo = 1;

  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    const size = SIZES[state.size];
    canvas.width = size.w;
    canvas.height = size.h;
  }
  renderLibrary();
  syncControls();
  redraw();
  // Two frames so the fonts and the canvas paint settle before the shot.
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  window.__shotReady = true;
}
