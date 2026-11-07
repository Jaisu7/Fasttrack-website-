import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, X, ScanLine } from "lucide-react";
export default function WorkshopWidget({ onSelect }) {
  const [open, setOpen] = useState(false),
    [visible, setVisible] = useState(false),
    root = useRef(null);
  useEffect(() => {
    const el = document.getElementById("manufacturing");
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(el);
    const close = (e) => {
      if (e.key === "Escape") setOpen(false);
      if (
        e.type === "pointerdown" &&
        root.current &&
        !root.current.contains(e.target)
      )
        setOpen(false);
    };
    document.addEventListener("keydown", close);
    document.addEventListener("pointerdown", close);
    return () => {
      observer.disconnect();
      document.removeEventListener("keydown", close);
      document.removeEventListener("pointerdown", close);
    };
  }, []);
  return (
    <aside
      ref={root}
      className={`workshop-widget${visible ? " visible" : ""}`}
      aria-label="Quick process navigation"
    >
      {open && (
        <div id="workshop-menu" className="workshop-menu">
          <p>Inside the process</p>
          {["Laser cutting", "CNC punching", "Bending", "Welding"].map(
            (name, i) => (
              <button
                key={name}
                onClick={() => {
                  onSelect(i);
                  setOpen(false);
                }}
              >
                {name}
                <ArrowUpRight size={16} />
              </button>
            ),
          )}
          <a href="#products" onClick={() => setOpen(false)}>
            Product showroom <ArrowUpRight size={16} />
          </a>
        </div>
      )}
      <button
        className="workshop-trigger"
        aria-expanded={open}
        aria-controls="workshop-menu"
        onClick={() => setOpen(!open)}
      >
        {open ? <X size={18} /> : <ScanLine size={18} />} Process studio
      </button>
    </aside>
  );
}
