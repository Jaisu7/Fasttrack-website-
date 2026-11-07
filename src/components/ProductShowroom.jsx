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
import { products, categories } from "../lib/fasttrack-data";
import WineChillerFilm from "./WineChillerFilm";
function ProductViewer({ product }) {
  const canvas = useRef(null),
    root = useRef(null),
    engine = useRef(null),
    [ready, setReady] = useState(false),
    [failed, setFailed] = useState(false),
    [rotation, setRotation] = useState(false),
    [lighting, setLighting] = useState(0),
    [exploded, setExploded] = useState(false),
    [operation, setOperation] = useState(false),
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
          });
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
  function reset() {
    engine.current?.reset();
    setRotation(false);
    setLighting(0);
    setExploded(false);
    setOperation(false);
    setFinish(0);
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
              }}
            >
              <option value="0">Brushed steel</option>
              <option value="1">Satin steel</option>
            </select>
          </label>
        </div>
      )}
    </div>
  );
}
export default function ProductShowroom({ onEnquire }) {
  const [category, setCategory] = useState("All products"),
    [selected, setSelected] = useState(products[0].id);
  const visible = products.filter(
    (p) => category === "All products" || p.category === category,
  );
  const product = visible.find((p) => p.id === selected) || visible[0];
  return (
    <section id="products" className="section products-section">
      <div className="section-heading reveal">
        <h2>
          Made for the way
          <br />
          you work.
        </h2>
        <p>Explore equipment in 360°.<br />See the Wine Chiller in motion.</p>
      </div>
      <div className="tab-rail category-rail" aria-label="Product categories">
        {categories.map((c) => (
          <button
            key={c}
            aria-pressed={category === c}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="showroom-layout">
        <div className="product-list" aria-label="Product families">
          {visible.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelected(p.id)}
              aria-pressed={product.id === p.id}
            >
              {p.name}
              <ArrowUpRight size={17} />
            </button>
          ))}
        </div>
        {product.video ? <WineChillerFilm key={product.id} /> : <ProductViewer key={product.id} product={product} />}
        <div className="product-description">
          <h3>{product.name}</h3>
          <p>{product.detail}</p>
          <button className="text-link" onClick={() => onEnquire(product.name)}>
            Discuss this product <ArrowUpRight size={20} />
          </button>
          {!product.video && <p className="quiet concept-note">
            Representative 3D concepts. Final design, dimensions and equipment
            specifications are reviewed for your project.
            {!["worktable", "sink", "display", "cabinets", "custom"].includes(product.id)
              ? " Image fallback represents the product family rather than this exact model."
              : ""}
          </p>}
        </div>
      </div>
    </section>
  );
}
