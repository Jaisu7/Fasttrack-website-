import "../styles/product-showroom.css";
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
  Search,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
} from "lucide-react";
import ProjectList from "./ProjectList";
import { PROJECT_STORAGE_KEY, addProjectItem, readProject } from "../lib/project-list.mjs";
import ProductConfigurator from "./ProductConfigurator";
import { normalizeConfiguration, supportsConfiguration, configurationSummary } from "../lib/product-configuration.mjs";
import { products, categories } from "../lib/fasttrack-data";
function ProductViewer({ product, configuration, onFinish, onAdd, onEnquire, children }) {
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
    if (ready && configuration) { engine.current?.configure(configuration); setView("perspective"); }
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
  const chooseFinish = (value) => { setFinish(value); engine.current?.setFinish(value); onFinish?.(value); };
  return (
    <div ref={root} className="product-experience">
      <div className="product-stage">
        <img src={product.image} alt={`Illustrative ${product.name.toLowerCase()}`} loading="lazy" className={ready && !failed ? "hidden" : ""} />
        <canvas ref={canvas} tabIndex={failed ? -1 : 0} className={failed ? "unavailable" : ""} aria-label={`360 degree ${product.name} concept. Drag or use arrow keys to rotate.`} onKeyDown={(event) => {
          const direction = { ArrowLeft: [-0.12, 0], ArrowRight: [0.12, 0], ArrowUp: [0, -0.08], ArrowDown: [0, 0.08] }[event.key];
          if (direction) { event.preventDefault(); engine.current?.rotate(...direction); }
        }} />
        {!ready && <span className="viewer-message">{failed ? "Image preview · 3D requires WebGL" : "Preparing your product…"}</span>}
        <div className="stage-footer"><span><Move size={15} /> Drag to explore <i>· Scroll to zoom</i></span><div className="product-zoom-controls"><button disabled={!ready} aria-label="Zoom out product" onClick={() => engine.current?.zoom(1.18)}>−</button><button disabled={!ready} aria-label="Zoom in product" onClick={() => engine.current?.zoom(0.85)}>+</button></div></div>
      </div>
      <aside className="product-inspector" key={product.id} aria-label="Product details and configuration">
        <h3>{product.name}</h3><p className="product-inspector-lead">{product.description}</p>
        <div className="product-view-presets" aria-label="View angle">{[["perspective", "Studio"], ["front", "Front"], ["side", "Side"], ["top", "Top"]].map(([id, label]) => <button key={id} disabled={!ready} aria-pressed={view === id} onClick={() => { setView(id); engine.current?.setView(id); }}>{label}</button>)}</div>
        <div className="finish-row"><span>Finish</span><fieldset aria-label="Product steel finish"><legend className="sr-only">Product steel finish</legend>{[[0, "Brushed"], [1, "Satin"]].map(([id, label]) => <label key={id} className={finish === id ? "chosen" : ""}><input type="radio" name={`finish-${product.id}`} value={id} checked={finish === id} disabled={!ready} onChange={() => chooseFinish(id)} /><i className={`steel-swatch swatch-${id}`} />{label}</label>)}</fieldset></div>
        {action && <div className="product-operation"><button className="text-control" disabled={!ready} aria-pressed={operation} onClick={() => engine.current?.setOperation(!operation)}><action.Icon size={16} />{product.operation === "doors" ? operation ? "Close doors" : "Open doors" : `${action.label}: ${operation ? "On" : "Off"}`}</button>
        {product.operation === "doors" && <div className="door-opening-control"><label htmlFor={`door-${product.id}`}>Door opening <span>{Math.round(opening * 86 / 100)}°</span></label><input id={`door-${product.id}`} aria-label="Door opening" type="range" min="0" max="100" disabled={!ready} value={opening} onChange={(e) => engine.current?.setOperation(Number(e.target.value) / 100)} /><p className="quiet">Adjust the opening, or tap a door on the model.</p></div>}</div>}
        {children}
        {!configuration && <><button className="button button-green inspector-add" onClick={() => onAdd(product.id, null)}>Add to project list <ArrowUpRight size={16} /></button><button className="inspector-enquire" onClick={() => onEnquire(product.name)}>Enquire about this product <ArrowUpRight size={15} /></button></>}
        <details className="inspector-details viewer-advanced"><summary>Details &amp; viewer tools</summary><div className="viewer-controls">
          <button className="button button-outline" disabled={!ready || reduced} aria-pressed={rotation} onClick={() => engine.current?.setRotation(!rotation)}><RotateCw size={16} />{rotation ? "Stop rotation" : "Rotate 360°"}</button>
          <button className="button button-outline" disabled={!ready} onClick={() => { const mode = (lighting + 1) % 3; setLighting(mode); engine.current?.setLighting(mode); }}><Sun size={16} />{["Studio", "Warm", "Cool"][lighting]} lighting</button>
          <button className="button button-outline" disabled={!ready} aria-pressed={exploded} onClick={() => { setExploded(!exploded); engine.current?.setAssembly(!exploded); }}><Layers size={16} />Exploded view</button>
          <button className="button button-outline" disabled={!ready} onClick={reset}><RotateCcw size={16} />Reset view</button>
        </div>
        {configuration && <details className="configuration-summary"><summary>Configuration summary</summary><pre>{configurationSummary(product.name, configuration)}</pre></details>}
        <p>{product.detail}</p><ul className="product-features">{product.options.map((option) => <li key={option}>{option}</li>)}</ul><p className="quiet">Illustrative 3D concept. Final dimensions, construction and specifications are reviewed for your project.</p></details>
      </aside>
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
    [projectOpen, setProjectOpen] = useState(false),
    [selected, setSelected] = useState(products[0].id);
  useEffect(() => { try { localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify({ version: 1, items: projectItems })); } catch { setStorageAvailable(false); } }, [projectItems]);
  useEffect(() => {
    const sync = (event) => { if (event.key === PROJECT_STORAGE_KEY) setProjectItems(readProject(event.newValue, products)); };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  useEffect(() => {
    const section = document.getElementById("products");
    const observer = new IntersectionObserver(([entry]) => document.body.classList.toggle("in-product-showroom", entry.isIntersecting));
    observer.observe(section);
    return () => { observer.disconnect(); document.body.classList.remove("in-product-showroom"); };
  }, []);
  function addToProject(productId, config) {
    const next = addProjectItem(projectItems, productId, config, crypto.randomUUID());
    if (next === projectItems) { setProjectStatus("Your list has 30 configurations. Remove an item before adding another."); return; }
    setProjectItems(next); setProjectOpen(true); setProjectStatus("Added to your project list below. Matching configurations are combined.");
  }
  function editProject(item) {
    setCategory("All products"); setQuery(""); setSelected(item.productId);
    if (item.configuration) setConfigurations((current) => ({ ...current, [item.productId]: { ...item.configuration, quantity: item.quantity } }));
    document.getElementById("products")?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
    setProjectStatus("Adjust the preview, then add it as a new option to compare. The saved option stays in your list.");
  }
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const matches = products.filter((p) => words.every((word) =>
    [p.name, p.description, p.detail, ...p.options].join(" ").toLowerCase().includes(word),
  ));
  const visible = matches.filter(
    (p) => category === "All products" || p.category === category,
  );
  const product = visible.find((p) => p.id === selected) || visible[0];
  const configuration = product && supportsConfiguration(product.id) ? configurations[product.id] || normalizeConfiguration(product.id) : null;
  const changeConfiguration = (next) => setConfigurations((current) => ({ ...current, [product.id]: next }));
  const gallery = useRef(null);
  const labels = { worktable: "SS tables", refrigerator: "Refrigerators", "hot-cabinet": "Hot cabinets", display: "Displays", sink: "Sinks", "sink-shelf": "Sinks + shelves", rack: "Racks", shelves: "Wall shelves", "produce-shelf": "Fruit & vegetable", cabinets: "Cabinets", custom: "Custom fabrication" };
  const categoryLabels = { "All products": "All equipment", "Kitchen equipment": "Kitchen", "Display & refrigeration": "Refrigeration", Storage: "Storage", "Custom fabrication": "Custom" };
  const galleryOrder = ["worktable", "refrigerator", "hot-cabinet", "display", "sink", "rack", "sink-shelf", "shelves", "produce-shelf", "cabinets", "custom"];
  const galleryProducts = [...visible].sort((a, b) => galleryOrder.indexOf(a.id) - galleryOrder.indexOf(b.id));
  return (
    <section id="products" className="section products-section">
      <div className="product-section-heading"><h2>Precision, on display.</h2><p>Explore. Refine. Make it yours.</p></div>
      <div className="product-browse-bar">
        <div className="tab-rail category-rail" aria-label="Product categories">{categories.map((c) => <button key={c} aria-pressed={category === c} onClick={() => { setCategory(c); setProjectStatus(""); }}>{categoryLabels[c]}</button>)}</div>
        <label className="product-search"><Search size={18} /><span className="sr-only">Find your equipment</span><input aria-label="Find your equipment" type="search" placeholder="Search equipment, e.g. table, sink…" value={query} onChange={(e) => { setQuery(e.target.value); setProjectStatus(""); }} /></label>
      </div>
      {(query || category !== "All products") && <div className="product-filter-status"><span role="status">{visible.length} equipment {visible.length === 1 ? "family" : "families"}</span><button className="text-control" onClick={() => { setQuery(""); setCategory("All products"); }}>Clear filters</button></div>}
      {product ? <>
        <ProductViewer key={`${product.id}:${configuration?.shelves ?? "default"}`} product={product} configuration={configuration} onFinish={configuration ? (finish) => changeConfiguration({ ...configuration, finish }) : undefined} onAdd={addToProject} onEnquire={onEnquire}>
          {configuration && <ProductConfigurator product={product} config={configuration} onChange={changeConfiguration} onEnquire={onEnquire} onAdd={addToProject} />}
          {projectStatus && <p className="product-save-status" role="status">{projectStatus} <a href="#project-list" onClick={() => setProjectOpen(true)}>View list ↗</a></p>}
        </ProductViewer>
        <div className="product-gallery-wrap"><div className="product-gallery-heading"><span>Explore the collection</span><div><button aria-label="Previous products" onClick={() => gallery.current?.scrollBy({ left: -450, behavior: reducedMotion() })}><ChevronLeft size={18} /></button><button aria-label="Next products" onClick={() => gallery.current?.scrollBy({ left: 450, behavior: reducedMotion() })}><ChevronRight size={18} /></button></div></div>
          <div ref={gallery} className="product-list product-gallery" aria-label="Product families">{galleryProducts.map((p) => <button key={p.id} onClick={() => { setSelected(p.id); setProjectStatus(""); const stage = document.querySelector("#products .product-stage"); if (stage && stage.getBoundingClientRect().top < 90) stage.scrollIntoView({ behavior: reducedMotion(), block: "start" }); }} aria-pressed={product.id === p.id} aria-label={p.name}><img src={`/images/product-previews/${p.id}.jpg`} alt="" loading="lazy" width="220" height="140" /><span>{labels[p.id] || p.name}</span></button>)}</div>
        </div>
      </> : <div className="product-empty"><h3>No matching equipment</h3><p>Try a broader search or choose another category.</p><button className="button button-outline" onClick={() => { setQuery(""); setCategory("All products"); }}>Show all products</button></div>}
      <details className="project-list-disclosure" open={projectOpen} onToggle={(e) => setProjectOpen(e.currentTarget.open)}><summary><FolderOpen size={23} /><strong>Your project list ({projectItems.length})</strong><span>Save, compare and enquire in one place.</span><i>+</i></summary><ProjectList items={projectItems} onChange={setProjectItems} onEdit={editProject} onEnquire={onEnquire} storageAvailable={storageAvailable} /></details>
    </section>
  );
}
function reducedMotion() { return matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth"; }
