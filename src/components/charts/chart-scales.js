/** Clean axis ticks from 0 to a "nice" max (steps of 1, 2 or 5 × 10ⁿ). */
export function getNiceTicks(maxValue, targetCount = 3) {
  if (!(maxValue > 0)) return [0, 1];
  const rawStep = maxValue / targetCount;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const step = [1, 2, 5, 10].map((factor) => factor * magnitude).find((candidate) => candidate >= rawStep);
  const ticks = [];
  for (let tick = 0; tick <= maxValue + step * 0.0001; tick += step) ticks.push(tick);
  if (ticks.at(-1) < maxValue) ticks.push(ticks.at(-1) + step);
  return ticks;
}

/** Axis label: full under 10,000, compact above (12K). */
export function formatAxisValue(value) {
  if (value >= 10_000) return `${Math.round(value / 1000)}K`;
  return value.toLocaleString('en-US');
}

/**
 * SVG path for a column with a 4px rounded data-end and a square baseline.
 * (x, y) is the top-left; the baseline is at y + height.
 */
export function columnPath(x, y, width, height, radius = 4) {
  const r = Math.min(radius, width / 2, height);
  return `M${x},${y + height} V${y + r} Q${x},${y} ${x + r},${y} H${x + width - r} Q${x + width},${y} ${x + width},${y + r} V${y + height} Z`;
}
