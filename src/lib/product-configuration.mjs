const templates = {
  worktable: { width: 1500, depth: 700, height: 900, shelves: 1 },
  rack: { width: 1200, depth: 500, height: 1800, shelves: 4 },
  sink: { width: 1500, depth: 700, height: 1500, shelves: 0 },
  "sink-shelf": { width: 1500, depth: 700, height: 1500, shelves: 1 },
};
export const supportsConfiguration = (id) => Object.hasOwn(templates, id);
export const shelfChoices = (id) => id === "rack" ? [2, 3, 4, 5, 6] : id === "worktable" ? [0, 1, 2] : [0, 1];
export function normalizeConfiguration(id, values = {}) {
  if (!supportsConfiguration(id)) return null;
  const defaults = templates[id];
  const bounded = (key, min, max) => {
    const n = Number(values[key] ?? defaults[key]);
    return Math.max(min, Math.min(max, Math.round(Number.isFinite(n) ? n : defaults[key])));
  };
  const choices = shelfChoices(id);
  return { width: bounded("width", 800, 2400), depth: bounded("depth", 400, 1000), height: bounded("height", 600, 2200),
    shelves: choices.includes(Number(values.shelves)) ? Number(values.shelves) : defaults.shelves,
    finish: values.finish === 1 ? 1 : 0, quantity: Math.max(1, Math.min(100, Math.round(Number(values.quantity) || 1))) };
}
export function configurationSummary(name, config) {
  return `${name}\nRequested overall size (W × D × H): ${config.width} × ${config.depth} × ${config.height} mm\n${name.includes("rack") ? "Shelf levels" : "Lower shelves"}: ${config.shelves}\nFinish: ${config.finish ? "Satin steel" : "Brushed steel"}\nQuantity: ${config.quantity}\n\nConcept configuration for quotation review. Final dimensions, construction and feasibility require confirmation by Fastrack.`;
}
