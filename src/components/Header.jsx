import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import Brand from "./Brand";
export default function Header() {
  const [open, setOpen] = useState(false);
  const header = useRef(null);
  const menu = useRef(null);
  useEffect(() => {
    if (!open) return;
    const closeOnEscape = event => {
      if (event.key === "Escape") { setOpen(false); menu.current?.focus(); }
    };
    const closeOutside = event => {
      if (!header.current?.contains(event.target)) setOpen(false);
    };
    const desktop = window.matchMedia("(min-width: 721px)");
    const closeOnDesktop = () => { if (desktop.matches) setOpen(false); };
    window.addEventListener("keydown", closeOnEscape);
    window.addEventListener("pointerdown", closeOutside);
    desktop.addEventListener("change", closeOnDesktop);
    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("pointerdown", closeOutside);
      desktop.removeEventListener("change", closeOnDesktop);
    };
  }, [open]);
  return (
    <header ref={header} className="site-header">
      <a className="skip-link" href="#studio">
        Skip to content
      </a>
      <div className="header-inner">
        <Brand />
        <nav id="primary-navigation" aria-label="Main navigation" className={open ? "nav open" : "nav"}>
          <a href="#manufacturing" onClick={() => setOpen(false)}>
            Manufacturing
          </a>
          <a href="#products" onClick={() => setOpen(false)}>
            Products
          </a>
          <a href="#about" onClick={() => setOpen(false)}>
            About
          </a>
        </nav>
        <a className="button button-green header-quote" href="#enquiry" onClick={() => setOpen(false)}>
          Request a quote <ArrowUpRight size={20} />
        </a>
        <button
          ref={menu}
          type="button"
          className="icon-button menu-toggle"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="primary-navigation"
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
    </header>
  );
}
