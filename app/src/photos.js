// Vice Cover Lab — the photo library.
// Four sample photos shipped with the app, free to use: the two from the
// kit (made with an image model for make.fun) and two made with an image
// model for this app. No photo of a real person, no game artwork. A person
// may also upload their own photo, which stays on their machine and is kept
// in memory only for this session.

export const PHOTOS = [
  {
    id: 'boulevard',
    src: 'samples/photo-boulevard.jpg',
    label: 'Boulevard',
    note: 'Palm-lined boulevard, golden hour',
  },
  {
    id: 'pier',
    src: 'samples/photo-pier.jpg',
    label: 'Pier',
    note: 'Wooden pier over turquoise water',
  },
  {
    id: 'rooftop',
    src: 'samples/photo-rooftop.jpg',
    label: 'Rooftop',
    note: 'Rooftop terrace at dusk',
  },
  {
    id: 'neon',
    src: 'samples/photo-neon.jpg',
    label: 'Neon Street',
    note: 'Neon-lit street, wet pavement',
  },
];

/** The photos the library holds right now, library photos plus uploads. */
export const library = [...PHOTOS];

/** A cache of loaded images, by photo id. */
const cache = new Map();

/** Loads one photo by id and returns its <img>, cached. */
export function loadPhoto(id) {
  const hit = cache.get(id);
  if (hit) return hit;
  const photo = library.find((p) => p.id === id);
  const promise = new Promise((resolve, reject) => {
    if (!photo) {
      reject(new Error(`no photo ${id}`));
      return;
    }
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`cannot load ${photo.src}`));
    img.src = photo.src;
  });
  cache.set(id, promise);
  return promise;
}

/** Loads every photo the library holds; resolves to a Map id -> <img>. */
export async function loadAllPhotos() {
  const entries = await Promise.all(
    library.map(async (p) => [p.id, await loadPhoto(p.id)]),
  );
  return new Map(entries);
}

/**
 * Adds an uploaded photo (a data: URL read from the person's own file) to
 * the library for this session and returns its id.
 */
export function addUpload(dataUrl, label) {
  const id = `upload-${Date.now()}`;
  const photo = { id, src: dataUrl, label, note: 'Uploaded by you' };
  library.push(photo);
  const promise = new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('cannot load uploaded photo'));
    img.src = dataUrl;
  });
  cache.set(id, promise);
  return id;
}
