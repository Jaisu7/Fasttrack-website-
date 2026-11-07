import { useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import Brand from "./Brand";
import ThemeToggle from "./ThemeToggle";
export default function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <a className="skip-link" href="#studio">
        Skip to content
      </a>
      <div className="header-inner">
        <Brand />
        <nav aria-label="Main navigation" className={open ? "nav open" : "nav"}>
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
        <ThemeToggle />
        <a className="button button-green header-quote" href="#enquiry">
          Request a quote <ArrowUpRight size={20} />
        </a>
        <button
          className="icon-button menu-toggle"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
    </header>
  );
}
