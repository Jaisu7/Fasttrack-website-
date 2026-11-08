import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUpRight } from "lucide-react";
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
    stageRef = useRef(0);
  const [stage, setStage] = useState(0),
    [ready, setReady] = useState(false),
    [fallback, setFallback] = useState(false),
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
    if (reduced) { show(1); return; }
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
                show(state.p);
              },
              scrollTrigger: {
                trigger: root.current,
                pin: pin.current,
                start: "top top",
                end: () =>
                  `+=${window.innerHeight * (window.innerWidth < 720 ? 2.7 : 3.6)}`,
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
        show(1);
      });
    return () => {
      alive = false;
      context?.revert();
      trigger.current = null;
    };
  }, [reduced]);
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
            <p className="journey-stage-label">0{stage + 1} / 05 · {s.name}</p>
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
              <a href="#products" className="button button-light">
                Explore Our Products <ArrowUpRight size={20} />
              </a>
              <a href="#enquiry" className="button button-outline">Discuss Your Project <ArrowUpRight size={20} /></a>
            </div>
          </div>
        </div>
        <div className="journey-bottom">
          <div className="stage-rail" aria-label="Manufacturing stages">
            {journeyStages.map((item, i) => (
              <span
                key={item.name}
                className={stage === i ? "active" : ""}
                aria-current={stage === i ? "step" : undefined}
              >
                <span className="stage-number">0{i + 1}</span> {item.name}
              </span>
            ))}
          </div>
          <div className="journey-caption">
            <span>Fastrack — Engineered in Steel.</span>
            <span className="scroll-hint">
              {reduced ? "Engineered in steel" : "Scroll to discover"}{" "}
              <ArrowDown size={17} />
            </span>
          </div>
        </div>
        <span className="sr-only" aria-live="polite">
          Stage {stage + 1} of 5: {s.name}.
        </span>
        {!ready && !fallback && (
          <span className="scene-loading">Preparing the steel…</span>
        )}
        {fallback && (
          <span className="scene-loading">
            Steel fabrication · From material to finished equipment
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
