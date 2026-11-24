export function formatNumber(value) {
  return value.toLocaleString('en-US');
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/** Zero-pads to a fixed width, e.g. formatLevel(7) → "07". */
export function padNumber(value, width = 2) {
  return String(value).padStart(width, '0');
}
