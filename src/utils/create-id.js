/** Locally unique id, e.g. "quest_m3x9k2_8f3k2j1q". Sufficient for on-device primary keys. */
export function createId(prefix) {
  const time = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 10).padEnd(8, '0');
  return `${prefix}_${time}_${random}`;
}
