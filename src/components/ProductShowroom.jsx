import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  RotateCw,
  RotateCcw,
  Sun,
  Layers,
  Move,
  DoorOpen,
  Lightbulb,
  Droplets,
} from "lucide-react";
import ProjectList from "./ProjectList";
import { PROJECT_STORAGE_KEY, addProjectItem, readProject } from "../lib/project-list.mjs";
import ProductConfigurator from "./ProductConfigurator";
import { normalizeConfiguration, supportsConfiguration } from "../lib/product-configuration.mjs";
import { products, categories } from "../lib/fasttrack-data";
function ProductViewer({ product, configuration, onFinish }) {
  const canvas = useRef(null),
    root = useRef(null),
    engine = useRef(null),
    [ready, setReady] = useState(false),
    [failed, setFailed] = useState(false),
    [rotation, setRotation] = useState(false),
    [lighting, setLighting] = useState(0),
    [exploded, setExploded] = useState(false),
    [operation, setOperation] = useState(false),
    [opening, setOpening] = useState(0),
    [view, setView] = useState("perspective"),
    [finish, setFinish] = useState(0),
    [reduced, setReduced] = useState(
      () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
  useEffect(() => {
    let alive = true;
    const observer = new IntersectionObserver(
      async (entries) => {
        if (!entries[0].isIntersecting) return;
        observer.disconnect();
        try {
          const m = await import("../lib/product-viewer-engine");
          if (!alive) return;
          engine.current = m.createProductViewer(canvas.current, product.id, {
            ready: () => alive && setReady(true),
            unavailable: () => alive && setFailed(true),
            rotation: (v) => alive && setRotation(v),
            operation: (amount) => { if (alive) { setOperation(amount > 0); setOpening(Math.round(amount * 100)); } },
          }, configuration);
        } catch {
          if (alive) setFailed(true);
        }
      },
      { rootMargin: "250px" },
    );
    observer.observe(root.current);
    const pref = window.matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setReduced(pref.matches);
    pref.addEventListener("change", change);
    return () => {
      alive = false;
      observer.disconnect();
      pref.removeEventListener("change", change);
      engine.current?.destroy();
      engine.current = null;
    };
  }, [product.id]);
  useEffect(() => {
    if (ready && configuration) engine.current?.configure(configuration);
  }, [ready, configuration?.width, configuration?.depth, configuration?.height]);
  useEffect(() => {
    if (ready && configuration) { engine.current?.setFinish(configuration.finish); setFinish(configuration.finish); }
  }, [ready, configuration?.finish]);
  function reset() {
    engine.current?.reset();
    setRotation(false);
    setLighting(0);
    setExploded(false);
    setOperation(false);
    setOpening(0);
    setView("perspective");
    setFinish(0);
    onFinish?.(0);
  }
  const action =
    product.operation === "doors"
      ? { label: "Open doors", Icon: DoorOpen }
      : product.operation === "lights"
        ? { label: "Display lights", Icon: Lightbulb }
        : product.operation === "water"
          ? { label: "Water flow", Icon: Droplets }
          : null;
  return (
    <div ref={root} className="viewer-column">
      <div className="product-stage">
        <img
          src={product.image}
          alt={`Illustrative ${product.name.toLowerCase()}`}
          loading="lazy"
          className={ready && !failed ? "hidden" : ""}
        />
        <canvas
          ref={canvas}
          tabIndex={failed ? -1 : 0}
          className={failed ? "unavailable" : ""}
          aria-label={`360 degree ${product.name} concept. Drag or use arrow keys to rotate.`}
          onKeyDown={(e) => {
            const v = {
              ArrowLeft: [-0.12, 0],
              ArrowRight: [0.12, 0],
              ArrowUp: [0, -0.08],
              ArrowDown: [0, 0.08],
            }[e.key];
            if (v) {
              e.preventDefault();
              engine.current?.rotate(...v);
            }
          }}
        />
        {!ready && (
          <span className="viewer-message">
            {failed
              ? "Image preview · 3D requires WebGL"
              : "Preparing the 3D model…"}
          </span>
        )}
      </div>
      <div className="media-caption">
        <span>
          <Move size={14} /> Interactive concept · Drag to rotate
        </span>
        <span>
          {lighting === 0 ? "Studio" : lighting === 1 ? "Warm" : "Cool"}{" "}
          lighting
        </span>
      </div>
      <div className="product-view-tools" aria-label="Product camera controls">
        <div className="product-view-presets" aria-label="View angle">
          {[["perspective", "Studio"], ["front", "Front"], ["side", "Side"], ["top", "Top"]].map(([id, label]) => <button key={id} disabled={!ready} aria-pressed={view === id} onClick={() => { setView(id); engine.current?.setView(id); }}>{label}</button>)}
        </div>
        <div className="product-zoom-controls"><button disabled={!ready} aria-label="Zoom out product" onClick={() => engine.current?.zoom(1.18)}>−</button><button disabled={!ready} aria-label="Zoom in product" onClick={() => engine.current?.zoom(0.85)}>+</button></div>
      </div>
      <div className="viewer-controls">
        <button
          className="button button-outline"
          disabled={!ready || reduced}
          aria-pressed={rotation}
          onClick={() => engine.current?.setRotation(!rotation)}
        >
          <RotateCw size={17} />
          {rotation ? "Stop rotation" : "Rotate 360°"}
        </button>
        <button
          className="button button-outline"
          disabled={!ready}
          onClick={() => {
            const m = (lighting + 1) % 3;
            setLighting(m);
            engine.current?.setLighting(m);
          }}
        >
          <Sun size={17} />
          Lighting
        </button>
        <button
          className="button button-outline"
          disabled={!ready}
          aria-pressed={exploded}
          onClick={() => {
            setExploded(!exploded);
            engine.current?.setAssembly(!exploded);
          }}
        >
          <Layers size={17} />
          Exploded view
        </button>
        <button
          className="button button-outline"
          disabled={!ready}
          onClick={reset}
        >
          <RotateCcw size={17} />
          Reset
        </button>
      </div>
      {ready && (
        <div className="viewer-options">
          {action && (
            <button
              className="text-control"
              aria-pressed={operation}
              onClick={() => {
                setOperation(!operation);
                engine.current?.setOperation(!operation);
              }}
            >
              <action.Icon size={16} />
              {action.label}: {operation ? "On" : "Off"}
            </button>
          )}
          <label>
            Finish{" "}
            <select
              aria-label="Product steel finish"
              value={finish}
              onChange={(e) => {
                const f = Number(e.target.value);
                setFinish(f);
                engine.current?.setFinish(f);
                onFinish?.(f);
              }}
            >
              <option value="0">Brushed steel</option>
              <option value="1">Satin steel</option>
            </select>
          </label>
        </div>
      )}
      {ready && product.operation === "doors" && <div className="door-opening-control">
        <label htmlFor={`door-${product.id}`}>Door opening <span>{Math.round(opening * 86 / 100)}°</span></label>
        <input id={`door-${product.id}`} aria-label="Door opening" type="range" min="0" max="100" value={opening} onChange={(e) => engine.current?.setOperation(Number(e.target.value) / 100)} />
        <p className="quiet">Drag to inspect the interior, or tap a door on the model. Arrow keys rotate the view.</p>
      </div>}
    </div>
  );
}
export default function ProductShowroom({ onEnquire }) {
  const [category, setCategory] = useState("All products"),
    [query, setQuery] = useState(""),
    [configurations, setConfigurations] = useState({}),
    [projectItems, setProjectItems] = useState(() => { try { return readProject(localStorage.getItem(PROJECT_STORAGE_KEY), products); } catch { return []; } }),
    [storageAvailable, setStorageAvailable] = useState(true),
    [projectStatus, setProjectStatus] = useState(""),
    [selected, setSelected] = useState(products[0].id);
  useEffect(() => { try { localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify({ version: 1, items: projectItems })); } catch { setStorageAvailable(false); } }, [projectItems]);
  useEffect(() => {
    const sync = (event) => { if (event.key === PROJECT_STORAGE_KEY) setProjectItems(readProject(event.newValue, products)); };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  function addToProject(productId, config) {
    const next = addProjectItem(projectItems, productId, config, crypto.randomUUID());
    if (next === projectItems) { setProjectStatus("Your list has 30 configurations. Remove an item before adding another."); return; }
    setProjectItems(next); setProjectStatus("Added to your project list below. Matching configurations are combined.");
  }
  function editProject(item) {
    setCategory("All products"); setQuery(""); setSelected(item.productId);
    if (item.configuration) setConfigurations((current) => ({ ...current, [item.productId]: { ...item.configuration, quantity: item.quantity } }));
    document.getElementById("products")?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
    setProjectStatus("Adjust the preview, then add it as a new option to compare. The saved option stays in your list.");
  }
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const matches = products.filter((p) => words.every((word) =>
    [p.name, p.category, p.description, ...p.options].join(" ").toLowerCase().includes(word),
  ));
  const visible = matches.filter(
    (p) => category === "All products" || p.category === category,
  );
  const product = visible.find((p) => p.id === selected) || visible[0];
  const configuration = product && supportsConfiguration(product.id) ? configurations[product.id] || normalizeConfiguration(product.id) : null;
  const changeConfiguration = (next) => setConfigurations((current) => ({ ...current, [product.id]: next }));
  return (
    <section id="products" className="section products-section">
      <div className="section-heading reveal">
        <h2>
          Made for the way
          <br />
          you work.
        </h2>
        <p>Explore equipment in 360°. Find the right starting point for your project.</p>
      </div>
      <div className="product-search-bar">
        <label htmlFor="product-search">Find your equipment
          <input id="product-search" type="search" placeholder="Search sinks, racks, refrigerators…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <span className="quiet" role="status">{visible.length} of {products.length} product families</span>
        <a className="text-control project-list-shortcut" href="#project-list">Project list ({projectItems.length})</a>
        {(query || category !== "All products") && <button className="text-control" onClick={() => { setQuery(""); setCategory("All products"); }}>Clear filters</button>}
      </div>
      <div className="tab-rail category-rail" aria-label="Product categories">
        {categories.map((c) => (
          <button
            key={c}
            aria-pressed={category === c}
            onClick={() => setCategory(c)}
          >
            {c}<span className="category-count">{matches.filter((p) => c === "All products" || p.category === c).length}</span>
          </button>
        ))}
      </div>
      {product ? <div className="showroom-layout">
        <div className="product-list" aria-label="Product families">
          {visible.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelected(p.id)}
              aria-pressed={product.id === p.id}
            >
              <span className="product-list-copy"><strong>{p.name}</strong><small>{p.description}</small></span>
              <ArrowUpRight size={17} />
            </button>
          ))}
        </div>
        <div><ProductViewer key={`${product.id}:${configuration?.shelves ?? "default"}`} product={product} configuration={configuration} onFinish={configuration ? (finish) => changeConfiguration({ ...configuration, finish }) : undefined} />
        {configuration && <ProductConfigurator product={product} config={configuration} onChange={changeConfiguration} onEnquire={onEnquire} onAdd={addToProject} />}</div>
        <div className="product-description">
          <p className="product-category-label">{product.category}</p>
          <h3>{product.name}</h3>
          <p>{product.detail}</p>
          <ul className="product-features">{product.options.map((option) => <li key={option}>{option}</li>)}</ul>
          <button className="text-link" onClick={() => onEnquire(product.name)}>
            Discuss this product <ArrowUpRight size={20} />
          </button>
          {!configuration && <button className="button button-outline" onClick={() => addToProject(product.id, null)}>Add product to project list</button>}
          <p className="quiet concept-note">
            Representative 3D concepts. Final design, dimensions and equipment
            specifications are reviewed for your project.
            {!["worktable", "sink", "display", "cabinets", "custom"].includes(product.id)
              ? " Image fallback represents the product family rather than this exact model."
              : ""}
          </p>
        </div>
      </div> : <div className="product-empty"><h3>No matching equipment</h3><p>Try a broader search or choose another category.</p><button className="button button-outline" onClick={() => { setQuery(""); setCategory("All products"); }}>Show all products</button></div>}
      <p className="form-status" role="status">{projectStatus}</p>
      <ProjectList items={projectItems} onChange={setProjectItems} onEdit={editProject} onEnquire={onEnquire} storageAvailable={storageAvailable} />
    </section>
  );
}
