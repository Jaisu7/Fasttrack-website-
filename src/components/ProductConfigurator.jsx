import { normalizeConfiguration, shelfChoices, configurationSummary } from "../lib/product-configuration.mjs";

export default function ProductConfigurator({ product, config, onChange, onEnquire, onAdd }) {
  const update = (key, value) => onChange(normalizeConfiguration(product.id, { ...config, [key]: value }));
  return <div className="product-configurator">
    <details open className="configuration-dimensions"><summary>Configure dimensions</summary>
      <div className="config-dimensions">{[["width", "Width", 800, 2400], ["depth", "Depth", 400, 1000], ["height", "Height", 600, 2200]].map(([key, label, min, max]) => <label key={key} htmlFor={`config-${key}`}><span>{label}</span><input id={`config-${key}`} aria-label={`${key === "height" ? "Overall height" : label} in millimetres`} type="range" min={min} max={max} step="50" value={config[key]} onChange={(e) => update(key, Number(e.target.value))} /><output>{config[key]} mm</output></label>)}</div>
      <div className="config-options"><label>{product.id === "rack" ? "Shelf levels" : "Lower shelf"}<select aria-label="Shelf arrangement" value={config.shelves} onChange={(e) => update("shelves", Number(e.target.value))}>{shelfChoices(product.id).map((n) => <option key={n} value={n}>{n === 0 ? "No lower shelf" : product.id === "rack" ? `${n} levels` : n === 1 ? "With lower shelf" : "Two lower shelves"}</option>)}</select></label>
      <label>Quantity<div className="quantity-stepper"><button aria-label="Decrease configured quantity" disabled={config.quantity <= 1} onClick={() => update("quantity", config.quantity - 1)}>−</button><input aria-label="Configured quantity" type="number" min="1" max="100" value={config.quantity} onChange={(e) => update("quantity", e.target.value)} /><button aria-label="Increase configured quantity" disabled={config.quantity >= 100} onClick={() => update("quantity", config.quantity + 1)}>+</button></div></label></div>
    </details>
    <button className="button button-green inspector-add" onClick={() => onAdd(product.id, config)}>Add to project list <span aria-hidden="true">↗</span></button>
    <button className="inspector-enquire" onClick={() => onEnquire(product.name, configurationSummary(product.name, config))}>Enquire about this product <span aria-hidden="true">↗</span></button>
  </div>;
}
