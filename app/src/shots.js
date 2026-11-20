// Fixed scenes for screenshots: ?shot=editor shows the page with sample
// photos loaded; ?shot=cover shows one exported cover alone, drawn by the
// app itself at the export size. window.__shotReady is set once painted.
//
// Query knobs: layout, grade, size (square|portrait|wide|story), title,
// subtitle, photo (the sample each slot starts from:
// boulevard|pier|rooftop|neon), badge (on|off).
import { SIZES } from './cover.js';

export const SAMPLES = {
  boulevard: 'samples/boulevard.jpg',
  pier: 'samples/pier.jpg',
  rooftop: 'samples/rooftop.jpg',
  neon: 'samples/neon.jpg',
};

// The library order for a shot: the requested photo first, then the other
// three in their fixed order, so every slot shows a different photo.
export function shotPhotoOrder(first) {
  const names = Object.keys(SAMPLES);
  return [first, ...names.filter((n) => n !== first)];
}

export async function runShot(shot, query, api) {
  const { state, photos, redraw, syncControls, renderLibrary, loadImage } = api;
  const canvas = document.getElementById('cover');
  state.layout = query.get('layout') || 'hero';
  state.grade = query.get('grade') || 'sunset';
  state.size = query.get('size') || 'wide';
  state.title = query.get('title') || 'VICE COVER';
  state.subtitle = query.get('subtitle') || 'chasing the sunset';
  state.badge = query.get('badge') !== 'off';

  const first = SAMPLES[query.get('photo')] ? query.get('photo') : 'boulevard';
  const order = shotPhotoOrder(first);
  const loaded = await Promise.all(order.map((name) => loadImage(SAMPLES[name])));
  loaded.forEach((img, i) => photos.push({ img, name: order[i] }));
  // Each of the four slots shows a different sample photo, so every panel
  // of every layout is filled with a distinct image.
  state.slots[0].photo = 0;
  state.slots[1].photo = 1;
  state.slots[2].photo = 2;
  state.slots[3].photo = 3;

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
