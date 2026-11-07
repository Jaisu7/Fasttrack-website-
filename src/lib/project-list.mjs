import { normalizeConfiguration, configurationSummary } from "./product-configuration.mjs";
export const PROJECT_STORAGE_KEY = "fastrack-project-v1";
export function readProject(raw, catalog) {
  try {
    const data = JSON.parse(raw);
    if (data?.version !== 1 || !Array.isArray(data.items)) return [];
    return data.items.slice(0, 30).flatMap((item) => {
      const product = catalog.find((p) => p.id === item?.productId);
      if (!product || typeof item.id !== "string") return [];
      const configuration = item.configuration && typeof item.configuration === "object" ? normalizeConfiguration(product.id, item.configuration) : null;
      return [{ id: item.id.slice(0, 80), productId: product.id, configuration, quantity: Math.max(1, Math.min(100, Math.round(Number(item.quantity) || 1))) }];
    });
  } catch { return []; }
}
export function addProjectItem(items, productId, configuration, id) {
  const config = configuration ? normalizeConfiguration(productId, configuration) : null;
  const signature = (item) => JSON.stringify([item.productId, item.configuration && { ...item.configuration, quantity: 1 }]);
  const entry = { id, productId, configuration: config, quantity: config?.quantity || 1 };
  const found = items.findIndex((item) => signature(item) === signature(entry));
  if (found >= 0) return items.map((item, i) => i === found ? { ...item, quantity: Math.min(100, item.quantity + entry.quantity) } : item);
  return items.length < 30 ? [...items, entry] : items;
}
export function projectSummary(items, catalog) {
  return "FASTRACK — PROJECT EQUIPMENT LIST\n\n" + items.map((item, index) => {
    const product = catalog.find((p) => p.id === item.productId);
    if (!product) return "";
    return `${index + 1}. ${item.configuration ? configurationSummary(product.name, { ...item.configuration, quantity: item.quantity }) : `${product.name}\nQuantity: ${item.quantity}\nConfiguration to be discussed.`}`;
  }).filter(Boolean).join("\n\n---\n\n") + "\n\nPlease review this list and provide a quotation. No price or manufacturing commitment is implied.";
}
