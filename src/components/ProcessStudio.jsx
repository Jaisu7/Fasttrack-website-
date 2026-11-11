import { useEffect, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import DeferredImage from "./DeferredImage";
const processes = [
  {
    id: "laser",
    tab: "Laser cutting",
    title: "CNC laser cutting",
    copy: "Profiles and openings prepared around your drawings, from equipment panels to decorative components.",
    instruction:
      "Move across the sheet to guide a cut. The automatic toolpath waits while you guide the head. Use arrow keys for precise control.",
  },
  {
    id: "punching",
    tab: "CNC punching",
    title: "Precision in every stroke.",
    copy: "Repeated openings and perforation patterns for ventilation panels, enclosures and equipment components.",
    instruction:
      "Move to choose the next punch position. The tool finishes each stroke before moving sideways. Arrow keys also guide the tool.",
  },
  {
    id: "bending",
    tab: "Bending",
    title: "From flat sheet to form.",
    copy: "Folded panels, edges and channels that turn your sheet-metal layout into practical components.",
    instruction:
      "Move vertically to control the bend. Use up and down arrow keys for precise control.",
  },
  {
    id: "welding",
    tab: "Welding",
    title: "A connection that lasts.",
    copy: "Joining fabricated parts into equipment, counters and assemblies, with the required finish reviewed for your project.",
    instruction:
      "Move along the emblem to guide the torch. The finished panel exits before the next cycle.",
  },
];
const capabilityDetails = {
  laser: { applications: "Profiled panels, equipment components and decorative cut-outs.", material: "Tell us the material grade, sheet thickness and required profile." },
  punching: { applications: "Perforated panels, ventilation openings and repeated hole patterns.", material: "Share the material grade, thickness, hole pattern and quantity." },
  bending: { applications: "Cabinet panels, folded edges, channels and equipment enclosures.", material: "Share the material grade, thickness, bend dimensions and drawing." },
  welding: { applications: "Joining fabricated components into equipment, frames and assemblies.", material: "Tell us the material grade, joint details and required surface finish." },
};
function ProcessScene({ process, onEnquire }) {
  const canvas = useRef(null),
    root = useRef(null),
    engine = useRef(null),
    [ready, setReady] = useState(false),
    [failed, setFailed] = useState(false);
  useEffect(() => {
    let alive = true,
      observer;
    const start = async () => {
      try {
        const m =
          process.id === "laser"
            ? await import("../lib/laser-animation")
            : await import("../lib/process-animation");
        if (!alive) return;
        const callbacks = {
          ready: () => alive && setReady(true),
          mode: () => {},
          reduced: () => {},
          unavailable: () => alive && setFailed(true),
        };
        engine.current =
          process.id === "laser"
            ? m.createLaserAnimation(canvas.current, callbacks)
            : m.createProcessAnimation(canvas.current, process.id, callbacks);
      } catch {
        if (alive) setFailed(true);
      }
    };
    observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          observer.disconnect();
          start();
        }
      },
      { rootMargin: "400px" },
    );
    observer.observe(root.current);
    return () => {
      alive = false;
      observer.disconnect();
      engine.current?.destroy();
      engine.current = null;
    };
  }, [process.id]);
  function key(e) {
    const v = {
      ArrowLeft: [-0.025, 0],
      ArrowRight: [0.025, 0],
      ArrowUp: [0, -0.025],
      ArrowDown: [0, 0.025],
    }[e.key];
    if (v) {
      e.preventDefault();
      engine.current?.nudge(...v);
    }

  }
  return (
    <div className="process-layout" ref={root}>
      <div className="process-copy">
        <h3>{process.title}</h3>
        <p className="process-lead">{process.copy}</p>
        <dl className="capability-details">
          <div><dt>Typical applications</dt><dd>{capabilityDetails[process.id].applications}</dd></div>
          <div><dt>Material & project review</dt><dd>{capabilityDetails[process.id].material}</dd></div>
        </dl>
        <button type="button" className="button button-light capability-enquiry" onClick={() => onEnquire(process.tab)}>Enquire about {process.tab} <ArrowUpRight size={18} /></button>
        <a className="service-information-link" href={`/services/${process.id === "laser" ? "laser-cutting" : process.id === "punching" ? "cnc-punching" : process.id}`}>Service details & quotation guidance ↗</a>
        <p className="quiet capability-note">Material suitability and machine capacity are confirmed after drawing review.</p>
        <p className="sr-only" id={`instructions-${process.id}`}>Use arrow keys to guide the manufacturing demonstration.</p>
      </div>
      <div className="process-media">
        <div
          className="process-canvas"
          onPointerMove={(e) => {
            if (e.pointerType !== "touch" || e.buttons)
              engine.current?.point(e.clientX, e.clientY);
          }}
          onPointerDown={(e) => engine.current?.point(e.clientX, e.clientY)}
          onPointerLeave={() => engine.current?.leave()}
          onPointerUp={(e) => { if (e.pointerType === "touch") engine.current?.leave(); }}
        >
          <DeferredImage
            className={ready && !failed ? "hidden" : ""}
            src={
              process.id === "bending"
                ? "/images/bending.webp"
                : "/images/laser-bed.webp"
            }
            alt="Illustrative manufacturing scene"
            loading="lazy"
          />
          <canvas
            ref={canvas}
            className={failed ? "unavailable" : ""}
            tabIndex={failed ? -1 : 0}
            aria-label={`${process.tab} interactive demonstration`}
            aria-describedby={`instructions-${process.id}`}
            onKeyDown={key}
          />
        </div>
        <div className="media-caption">
          <span>Illustrative process · Sound off</span>
          <span>
            {process.tab} <ArrowUpRight size={13} />
          </span>
        </div>
      </div>
    </div>
  );
}
export default function ProcessStudio({ selected, setSelected, onEnquire }) {
  return (
    <section id="studio" tabIndex={-1} className="section process-section light-section">
      <div className="chapter-label"><span>03 / Capabilities</span><i/></div>
      <div className="section-heading reveal">
        <h2>
          Four processes.
          <br />
          One standard.
        </h2>
        <p>
          Explore our fabrication capabilities.
          <br className="desktop-break" />
          Select a process to discuss your requirements.
        </p>
      </div>
      <div
        className="tab-rail"
        role="tablist"
        aria-label="Manufacturing processes"
      >
        {processes.map((p, i) => (
          <button
            role="tab"
            id={`tab-${p.id}`}
            aria-controls="process-panel"
            tabIndex={selected === i ? 0 : -1}
            onKeyDown={(e) => {
              const next = e.key === "ArrowRight" ? (i + 1) % processes.length : e.key === "ArrowLeft" ? (i + processes.length - 1) % processes.length : e.key === "Home" ? 0 : e.key === "End" ? processes.length - 1 : null;
              if (next !== null) { e.preventDefault(); setSelected(next); document.getElementById(`tab-${processes[next].id}`)?.focus(); }
            }}
            aria-selected={selected === i}
            key={p.id}
            onClick={() => setSelected(i)}
          >
            {p.tab}
          </button>
        ))}
      </div>
      <div
        id="process-panel"
        role="tabpanel"
        aria-labelledby={`tab-${processes[selected].id}`}
      >
        <ProcessScene
          key={processes[selected].id}
          process={processes[selected]}
          onEnquire={onEnquire}
        />
      </div>
      <div className="process-ending reveal" aria-label="Cut. Form. Join. Finish.">{["Cut.", "Form.", "Join.", "Finish."].map((word) => <span key={word} aria-hidden="true">{word}</span>)}</div>
    </section>
  );
}
