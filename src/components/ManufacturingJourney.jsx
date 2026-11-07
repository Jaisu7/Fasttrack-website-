import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUpRight, Pause, Play, RotateCcw } from "lucide-react";
import { manufacturingState } from "../lib/journey-state.mjs";
export const journeyStages = [
  {
    name: "Raw steel",
    jump: 0,
    title: "From Raw Steel to Extraordinary Engineering.",
    copy: "Precision fabrication. Purpose-built kitchen equipment. Follow the journey from material to finished product.",
  },
  {
    name: "Laser",
    jump: 0.25,
    title: "Precision starts with a single cut.",
    copy: "The original Fastrack mark takes shape in the steel. Every contour follows the same primary panel.",
  },
  {
    name: "Punch",
    jump: 0.43,
    title: "Every detail has a purpose.",
    copy: "The tool lifts, the sheet positions, and each stroke creates a clean, repeatable opening.",
  },
  {
    name: "Bend",
    jump: 0.61,
    title: "Flat steel. New possibilities.",
    copy: "A controlled press-brake stroke folds the primary panel into a cabinet shell.",
  },
  {
    name: "Weld",
    jump: 0.78,
    title: "Individual parts. One complete vision.",
    copy: "Additional components join the formed panel. A precise seam brings the structure together.",
  },
  {
    name: "Finished",
    jump: 0.94,
    title: "Engineered for what comes next.",
    copy: "From a representative sheet to a complete cabinet concept. Explore the products behind the process.",
  },
];
const stageFor = (p) => manufacturingState(p).stageIndex;
export default function ManufacturingJourney() {
  const root = useRef(null),
    pin = useRef(null),
    canvas = useRef(null),
    engine = useRef(null),
    trigger = useRef(null),
    progress = useRef(0),
    pausedRef = useRef(false),
    stageRef = useRef(0);
  const [stage, setStage] = useState(0),
    [ready, setReady] = useState(false),
    [fallback, setFallback] = useState(false),
    [paused, setPaused] = useState(false),
    [reduced, setReduced] = useState(
      () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
  function show(p) {
    progress.current = p;
    engine.current?.setProgress(p);
    pin.current?.style.setProperty("--journey-progress", String(p));
    const next = stageFor(p);
    if (next !== stageRef.current) {
      stageRef.current = next;
      setStage(next);
    }
  }
  useEffect(() => {
    let alive = true;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onPreference = () => setReduced(preference.matches);
    preference.addEventListener("change", onPreference);
    import("../lib/manufacturing-scene")
      .then((scene) => {
        if (!alive) return;
        engine.current = scene.createManufacturingScene(canvas.current, {
          ready: () => alive && setReady(true),
          unavailable: () => alive && setFallback(true),
        });
        engine.current.setProgress(progress.current);
      })
      .catch(() => alive && setFallback(true));
    return () => {
      alive = false;
      preference.removeEventListener("change", onPreference);
      engine.current?.destroy();
      engine.current = null;
    };
  }, []);
  useEffect(() => {
    let alive = true,
      context;
    if (reduced) return;
    Promise.all([import("gsap"), import("gsap/ScrollTrigger")])
      .then(([{ gsap }, { ScrollTrigger }]) => {
        if (!alive) return;
        gsap.registerPlugin(ScrollTrigger);
        context = gsap.context(() => {
          const state = { p: 0 };
          const instance = gsap.fromTo(
            state,
            { p: 0 },
            {
              p: 1,
              ease: "none",
              onUpdate: () => {
                if (!pausedRef.current) show(state.p);
              },
              scrollTrigger: {
                trigger: root.current,
                pin: pin.current,
                start: "top top",
                end: () =>
                  `+=${window.innerHeight * (window.innerWidth < 720 ? 3.6 : 5.2)}`,
                scrub: 0.6,
                invalidateOnRefresh: true,
                anticipatePin: 1,
              },
            },
          );
          trigger.current = instance.scrollTrigger;
        }, root);
      })
      .catch(() => {
        /* Manual stage selection remains available. */
      });
    return () => {
      alive = false;
      context?.revert();
      trigger.current = null;
    };
  }, [reduced]);
  function select(i) {
    const p = journeyStages[i].jump;
    pausedRef.current = false;
    setPaused(false);
    engine.current?.pause(false);
    if (trigger.current && !reduced) {
      window.scrollTo({
        top:
          trigger.current.start +
          p * (trigger.current.end - trigger.current.start),
        behavior: "smooth",
      });
    } else show(p);
  }
  function toggle() {
    const value = !paused;
    pausedRef.current = value;
    setPaused(value);
    engine.current?.pause(value);
    if (!value && trigger.current) show(trigger.current.progress);
  }
  function skip(event) {
    event.preventDefault();
    document.getElementById("studio")?.scrollIntoView({
      behavior: reduced ? "instant" : "smooth",
    });
    document.getElementById("studio")?.focus({ preventScroll: true });
  }
  const s = journeyStages[stage];
  return (
    <section
      id="manufacturing"
      ref={root}
      className={`manufacturing${reduced ? " reduced" : ""}`}
      aria-label="Scroll-controlled manufacturing journey"
    >
      <div
        ref={pin}
        className="journey-pin"
        data-stage={s.name}
        onPointerMove={(e) => {
          if (e.pointerType === "mouse") {
            const r = e.currentTarget.getBoundingClientRect();
            engine.current?.setPointer(
              ((e.clientX - r.left) / r.width) * 2 - 1,
              ((e.clientY - r.top) / r.height) * 2 - 1,
            );
          }
        }}
        onPointerLeave={() => engine.current?.setPointer(0, 0)}
      >
        <div className="journey-media" aria-hidden="true">
          <img
            className={`journey-fallback${ready && !fallback ? " hidden" : ""}`}
            src="/images/laser-bed.webp"
            alt=""
            fetchPriority="high"
          />
          <canvas ref={canvas} className={fallback ? "unavailable" : ""} />
        </div>
        <div className="journey-shade" />
        <div className="journey-copy" key={stage}>
          <div className="journey-text">
            <p className="journey-stage-label">0{stage + 1} / 06 · {s.name}</p>
            <h1
              aria-label={s.title}
              className={stage === 0 ? "hero-title" : "stage-title"}
            >
              {stage === 0 ? (
                <>
                  <span>From Raw</span>{" "}
                  <span>
                    <em>Steel</em> to
                  </span>{" "}
                  <span>Extraordinary</span> <span>Engineering.</span>
                </>
              ) : (
                s.title
              )}
            </h1>
            <p>{s.copy}</p>
            <div className="hero-actions">
              {stage === 5 ? (
                <a href="#products" className="button button-light">
                  Explore Products <ArrowUpRight size={20} />
                </a>
              ) : (
                <button
                  className="button button-light"
                  onClick={() =>
                    select(stage === 0 ? 1 : Math.min(5, stage + 1))
                  }
                >
                  {stage === 0 ? "Explore the process" : "Next process"}{" "}
                  <ArrowDown size={20} />
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="journey-tools">
          <button
            className="journey-control"
            onClick={toggle}
            disabled={!ready || fallback || reduced}
            aria-label={
              paused
                ? "Resume manufacturing animation"
                : "Pause manufacturing animation"
            }
            aria-pressed={paused}
          >
            {paused ? <Play size={17} /> : <Pause size={17} />}
            {paused ? "Resume animation" : "Pause animation"}
          </button>
          <button className="journey-control journey-restart" onClick={() => select(0)} aria-label="Restart manufacturing journey">
            <RotateCcw size={16} /> Restart
          </button>
          <a href="#studio" className="journey-control journey-skip" onClick={skip}>
            Skip intro <ArrowDown size={16} />
          </a>
        </div>
        <div className="journey-bottom">
          <div className="stage-rail" aria-label="Manufacturing stages">
            {journeyStages.map((item, i) => (
              <button
                key={item.name}
                className={stage === i ? "active" : ""}
                aria-current={stage === i ? "step" : undefined}
                onClick={() => select(i)}
              >
                <span className="stage-number">0{i + 1}</span> {item.name}
              </button>
            ))}
          </div>
          <div className="journey-caption">
            <span>Fastrack — Engineered in Steel.</span>
            <span className="scroll-hint">
              {reduced ? "Select a stage to explore" : paused ? "Animation paused · Resume when ready" : "Scroll to manufacture"}{" "}
              <ArrowDown size={17} />
            </span>
          </div>
        </div>
        <span className="sr-only" aria-live="polite">
          Stage {stage + 1} of 6: {s.name}.
        </span>
        {!ready && !fallback && (
          <span className="scene-loading">Preparing the steel…</span>
        )}
        {fallback && (
          <span className="scene-loading">
            Still preview · Select a stage to read the story
          </span>
        )}
      </div>
      <div className="journey-note">
        Illustrative manufacturing sequence. We follow a representative primary
        panel; additional components join during assembly.
      </div>
    </section>
  );
}
