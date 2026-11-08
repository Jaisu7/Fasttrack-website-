import { useEffect, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
const processes = [
  {
    id: "laser",
    tab: "Laser cutting",
    title: "CNC laser cutting",
    copy: "A focused beam traces the Fastrack mark, then lifts clear for the finished sheet to leave.",
    instruction:
      "Move across the sheet to guide a cut. The automatic toolpath waits while you guide the head. Use arrow keys for precise control.",
  },
  {
    id: "punching",
    tab: "CNC punching",
    title: "Precision in every stroke.",
    copy: "Position. Clamp. Punch. The ram retracts before the next opening is positioned.",
    instruction:
      "Move to choose the next punch position. The tool finishes each stroke before moving sideways. Arrow keys also guide the tool.",
  },
  {
    id: "bending",
    tab: "Bending",
    title: "From flat sheet to form.",
    copy: "A controlled press stroke shapes the sheet. The formed part leaves before a fresh blank arrives.",
    instruction:
      "Move vertically to control the bend. Use up and down arrow keys for precise control.",
  },
  {
    id: "welding",
    tab: "Welding",
    title: "A connection that lasts.",
    copy: "Follow the original mark with a continuous illustrative weld bead.",
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
    [failed, setFailed] = useState(false),
    [manual, setManual] = useState(false),
    [reduced, setReduced] = useState(false),
    [cycle, setCycle] = useState({ phase: "working", index: 0 });
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
          mode: (v) => alive && setManual(v),
          reduced: (v) => alive && setReduced(v),
          unavailable: () => alive && setFailed(true),
          cycle: (phase, index) => alive && setCycle({ phase, index }),
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
        <p className="quiet capability-note">Material suitability and machine capacity are confirmed after drawing review.</p>
        <details className="process-instructions"><summary>Try the interactive demonstration</summary>
          <p id={`instructions-${process.id}`}>{process.instruction}</p>
          <ol className="production-steps" aria-label="Production cycle">
            {[ ["working", "Working"], ["complete", "Finished"], ["ejecting", "Release"], ["loading", "New sheet"] ].map(([phase, label], i, items) => (
              <li key={phase} className={cycle.phase === phase ? "active" : items.findIndex(([p]) => p === cycle.phase) > i ? "done" : ""} aria-current={cycle.phase === phase ? "step" : undefined}>
                <span>{String(i + 1).padStart(2, "0")}</span>{label}
              </li>
            ))}
          </ol>
          <p className="quiet cycle-count">Cycle {cycle.index + 1} · One piece at a time</p>
          <p className="quiet process-status" aria-live="polite">
            {failed
              ? "Still preview"
              : !ready
                ? "Loading process..."
                : reduced
                  ? "Reduced motion · Finished workpiece"
                  : manual
                      ? "Manual tool guidance"
                      : "Finish → release → fresh blank"}
          </p>
        </details>
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
          <img
            className={ready && !failed ? "hidden" : ""}
            src={
              process.id === "bending"
                ? "/images/bending.jpg"
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
    <section id="studio" tabIndex={-1} className="section process-section">
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
