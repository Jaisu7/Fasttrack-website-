import { normalizeConfiguration, shelfChoices, configurationSummary } from "../lib/product-configuration.mjs";

export default function ProductConfigurator({ product, config, onChange, onEnquire }) {
  const update = (key, value) => onChange(normalizeConfiguration(product.id, { ...config, [key]: value }));
  return <div className="product-configurator">
    <div className="config-heading"><h4>Configure your product</h4><span>Concept preview</span></div>
    <p className="quiet">Choose an overall size in millimetres. The 3D preview updates as you adjust it.</p>
    <div className="config-dimensions">{[["width", "Width", 800, 2400], ["depth", "Depth", 400, 1000], ["height", "Overall height", 600, 2200]].map(([key, label, min, max]) => <label key={key} htmlFor={`config-${key}`}>{label}<output>{config[key]} mm</output><input id={`config-${key}`} aria-label={`${label} in millimetres`} type="range" min={min} max={max} step="50" value={config[key]} onChange={(e) => update(key, Number(e.target.value))} /></label>)}</div>
    <div className="config-options"><label>{product.id === "rack" ? "Shelf levels" : "Lower shelves"}<select aria-label="Shelf arrangement" value={config.shelves} onChange={(e) => update("shelves", Number(e.target.value))}>{shelfChoices(product.id).map((n) => <option key={n} value={n}>{n === 0 ? "None" : n}</option>)}</select></label>
    <label>Finish<select aria-label="Configured finish" value={config.finish} onChange={(e) => update("finish", Number(e.target.value))}><option value="0">Brushed steel</option><option value="1">Satin steel</option></select></label>
    <label>Quantity<input aria-label="Configured quantity" type="number" min="1" max="100" value={config.quantity} onChange={(e) => update("quantity", e.target.value)} /></label></div>
    <details className="configuration-summary"><summary>View configuration summary</summary><pre>{configurationSummary(product.name, config)}</pre></details>
    <button className="button button-green" onClick={() => onEnquire(product.name, configurationSummary(product.name, config))}>Use this configuration in my enquiry</button>
    <p className="quiet">Dimensions show a proportional concept, including fittings. Final design and pricing are reviewed by our team.</p>
  </div>;
}
