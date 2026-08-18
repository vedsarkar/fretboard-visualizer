/**
 * Fretboard geometry and palette.
 *
 * Kept separate from the component so the same numbers drive rendering, hit
 * testing and PNG export.
 */

/** Every note in the selection uses one colour; painted notes override it. */
export const NOTE_COLOR = '#0070f2';

export const PAINT_COLORS = ['#ffffff', '#ff5b5b', '#ffb300', '#5ad469', '#38a3ff', '#b46bff'];

export const FONT = 'ui-sans-serif, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

export const COLORS = {
  board: '#221d19',
  boardEdge: '#0e0c0a',
  fret: '#7d7f83',
  nut: '#e6e0d4',
  inlay: '#3b342d',
  string: '#b9bcc2',
  fretNumber: '#8d8d8d',
  fretNumberOn: '#e8e8e8',
  openLabel: '#9a9a9a',
  muted: '#4a4a4a',
  noteText: '#ffffff',
};

const BASE = {
  padTop: 18,
  padBottom: 34,
  padLeft: 6,
  padRight: 16,
  labelWidth: 46,
  openWidth: 34,
  nutWidth: 7,
  stringGap: 34,
};

/**
 * @param {{stringCount:number, fretCount:number, leftHanded:boolean}} options
 */
export function computeLayout({ stringCount, fretCount, leftHanded }) {
  const fretWidth = fretCount > 17 ? 46 : fretCount > 13 ? 54 : 64;
  const boardLeft = BASE.padLeft + BASE.labelWidth + BASE.openWidth;
  const boardWidth = BASE.nutWidth + fretCount * fretWidth;
  const width = boardLeft + boardWidth + BASE.padRight;
  const boardTop = BASE.padTop;
  const boardHeight = stringCount * BASE.stringGap;
  const height = boardTop + boardHeight + BASE.padBottom;

  const mirror = (x) => (leftHanded ? width - x : x);

  return {
    ...BASE,
    fretWidth,
    boardLeft,
    boardWidth,
    boardTop,
    boardHeight,
    width,
    height,
    mirror,
    stringY: (i) => boardTop + BASE.stringGap / 2 + (stringCount - 1 - i) * BASE.stringGap,
    fretCentre: (fret) => boardLeft + BASE.nutWidth + (fret - 0.5) * fretWidth,
    fretLine: (fret) => boardLeft + BASE.nutWidth + fret * fretWidth,
    openX: boardLeft - BASE.openWidth / 2,
    labelX: BASE.padLeft + BASE.labelWidth / 2,
    nutCentre: boardLeft + BASE.nutWidth / 2,
    inlayY: boardTop + boardHeight / 2,
    inlayRadius: Math.min(7, BASE.stringGap / 5),
    numberY: boardTop + boardHeight + 18,
    noteRadius: Math.min(14, BASE.stringGap / 2 - 3),
    stringWidth: (i) => 1 + ((stringCount - 1 - i) / Math.max(1, stringCount - 1)) * 2.4,
  };
}

/** Serialise an <svg> element to a PNG blob, optionally with a title strip. */
export async function svgToPng(svg, { scale = 2, background = '#161616', title = '' } = {}) {
  if (!svg) return null;
  const box = svg.viewBox.baseVal;
  const width = box.width;
  const height = box.height;
  const titleHeight = title ? 40 : 0;

  const clone = svg.cloneNode(true);
  clone.setAttribute('width', String(width));
  clone.setAttribute('height', String(height));
  const markup = new XMLSerializer().serializeToString(clone);

  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
  });

  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = (height + titleHeight) * scale;
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height + titleHeight);
  if (title) {
    ctx.fillStyle = '#f0ede6';
    ctx.font = `600 20px ${FONT}`;
    ctx.textBaseline = 'middle';
    ctx.fillText(title, 14, titleHeight / 2 + 4);
  }
  ctx.drawImage(image, 0, titleHeight);
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}
