import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw, ArrowUpRight } from "lucide-react";
const processes = [
  {
    id: "laser",
    tab: "Laser cutting",
    title: "CNC laser cutting",
    copy: "The original Fastrack mark, traced in steel.",
    instruction:
      "Move across the scene to guide the head. Use arrow keys for precise control.",
  },
  {
    id: "punching",
    tab: "CNC punching",
    title: "Precision in every stroke.",
    copy: "A sequence of punched holes follows the original Fastrack emblem.",
    instruction:
      "Guide the tool across the sheet. The head lifts before travelling to its next position.",
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
function ProcessScene({ process }) {
  const canvas = useRef(null),
    root = useRef(null),
    engine = useRef(null),
    [ready, setReady] = useState(false),
    [failed, setFailed] = useState(false),
    [paused, setPaused] = useState(false),
    [manual, setManual] = useState(false),
    [reduced, setReduced] = useState(false);
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
  const pause = () => {
    engine.current?.pause(!paused);
    setPaused(!paused);
  };
  const reset = () => {
    engine.current?.reset();
    setManual(false);
  };
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
    if (e.key === " ") {
      e.preventDefault();
      pause();
    }
    if (e.key.toLowerCase() === "r") reset();
  }
  return (
    <div className="process-layout" ref={root}>
      <div className="process-copy">
        <h3>{process.title}</h3>
        <p className="process-lead">{process.copy}</p>
        <div className="process-instructions">
          <p id={`instructions-${process.id}`}>{process.instruction}</p>
          <div className="controls">
            <button
              className="button button-outline"
              onClick={pause}
              disabled={!ready || reduced}
              aria-pressed={paused}
            >
              {paused ? <Play size={17} /> : <Pause size={17} />}{" "}
              {paused ? "Play" : "Pause"}
            </button>
            <button
              className="button button-outline"
              disabled={!ready}
              onClick={reset}
            >
              <RotateCcw size={17} /> Reset
            </button>
          </div>
          <p className="quiet process-status" aria-live="polite">
            {failed
              ? "Still preview"
              : !ready
                ? "Loading process…"
                : reduced
                  ? "Reduced motion · Finished workpiece"
                  : paused
                    ? "Animation paused"
                    : manual
                      ? "Manual tool guidance"
                      : "Finish → release → fresh blank"}
          </p>
        </div>
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
export default function ProcessStudio({ selected, setSelected }) {
  return (
    <section id="studio" className="section process-section">
      <div className="section-heading reveal">
        <h2>
          Four processes.
          <br />
          One standard.
        </h2>
        <p>
          Move the tool.
          <br className="desktop-break" />
          Watch the material respond.
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
        />
      </div>
      <div className="process-ending reveal">Cut. Form. Join. Finish.</div>
    </section>
  );
}
