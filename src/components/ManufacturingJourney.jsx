import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { manufacturingState } from "../lib/journey-state.mjs";
import { RollingText } from "./Experience";
export const journeyStages = [
  {
    name: "Raw steel",
    jump: 0,
    title: "From Raw Steel to Extraordinary Engineering.",
    copy: "Custom stainless-steel kitchen equipment and fabrication in Sharjah. Explore how sheet metal becomes purpose-built equipment.",
  },
  {
    name: "Laser",
    jump: 0.25,
    title: "Precision starts with a single cut.",
    copy: "Cut profiles and openings for equipment panels, interiors and custom sheet-metal components.",
  },
  {
    name: "Bend",
    jump: 0.61,
    title: "Flat steel. New possibilities.",
    copy: "Folded panels, edges and channels bring your equipment layout into three dimensions.",
  },
  {
    name: "Weld",
    jump: 0.78,
    title: "Individual parts. One complete vision.",
    copy: "Fabricated components come together as equipment, frames and assemblies for your working space.",
  },
  {
    name: "Finished",
    jump: 0.94,
    title: "Engineered for what comes next.",
    copy: "Explore equipment layouts, choose your requirements and share a specification for quotation review.",
  },
];
const stageFor = (p) => manufacturingState(p).stageIndex;
export default function ManufacturingJourney({ onReady }) {
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
    [reduced, setReduced] = useState(false);
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
    onPreference();
    preference.addEventListener("change", onPreference);
    import("../lib/manufacturing-scene")
      .then((scene) => {
        if (!alive) return;
        engine.current = scene.createManufacturingScene(canvas.current, {
          ready: () => { if (alive) { setReady(true); onReady?.(); } },
          unavailable: () => { if (alive) { setFallback(true); onReady?.(); } },
        });
        engine.current.setProgress(progress.current);
      })
      .catch(() => { if (alive) { setFallback(true); onReady?.(); } });
    return () => {
      alive = false;
      preference.removeEventListener("change", onPreference);
      engine.current?.destroy();
      engine.current = null;
    };
  }, [onReady]);
  useEffect(() => {
    let alive = true,
      context;
    const refresh = () => trigger.current?.refresh();
    window.addEventListener("fastrack:intro-complete", refresh);
    if (reduced) {
      show(1);
      return () => window.removeEventListener("fastrack:intro-complete", refresh);
    }
    Promise.all([import("gsap"), import("gsap/ScrollTrigger")])
      .then(([{ gsap }, { ScrollTrigger }]) => {
        if (!alive) return;
        gsap.registerPlugin(ScrollTrigger);
        context = gsap.matchMedia(root.current);
        context.add({
          mobile: "(max-width: 720px), (hover: none) and (pointer: coarse)",
          always: "all",
        }, ({ conditions }) => {
          const mobile = conditions.mobile;
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
                end: () => {
                  // The small-viewport pin stays stable as phone browser bars move.
                  // More travel lets each fabrication stage remain readable.
                  const height = mobile ? pin.current.clientHeight : window.innerHeight;
                  return `+=${mobile ? Math.max(4800, height * 6.5) : height * 3.6}`;
                },
                scrub: mobile ? 1.2 : 0.6,
                invalidateOnRefresh: true,
                anticipatePin: 1,
              },
            },
          );
          trigger.current = instance.scrollTrigger;
          return () => { trigger.current = null; };
        });
      })
      .catch(() => {
        show(1);
      });
    return () => {
      alive = false;
      window.removeEventListener("fastrack:intro-complete", refresh);
      context?.revert();
      trigger.current = null;
    };
  }, [reduced]);
  useEffect(() => {
    let frame = 0;
    let width = root.current?.clientWidth;
    const refresh = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => trigger.current?.refresh());
    };
    const observer = new ResizeObserver(entries => {
      const next = Math.round(entries[0].contentRect.width);
      if (next === width) return;
      width = next;
      refresh();
    });
    if (root.current) observer.observe(root.current);
    window.addEventListener("resize", refresh);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", refresh);
    };
  }, []);
  const s = journeyStages[stage];
  function chooseStage(item) {
    const timeline = trigger.current;
    if (!timeline || reduced) { show(item.jump); return; }
    window.scrollTo({ top: timeline.start + (timeline.end - timeline.start) * item.jump, behavior: "smooth" });
  }
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
        onPointerDown={() => engine.current?.setInteracting(true)}
        onPointerUp={() => engine.current?.setInteracting(false)}
        onPointerCancel={() => engine.current?.setInteracting(false)}
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
        <div className="journey-media" aria-hidden="true" onPointerEnter={e => { if (e.pointerType === "mouse") engine.current?.setInteracting(true); }} onPointerLeave={() => engine.current?.setInteracting(false)}>
          <div className="scene-guides"><i/><i/></div>
          <img
            className={`journey-fallback${ready && !fallback ? " hidden" : ""}`}
            src="/images/laser-bed.webp"
            alt=""
            fetchPriority="high"
            decoding="async"
            width="1254"
            height="1254"
          />
          <canvas ref={canvas} className={fallback ? "unavailable" : ""} />
        </div>
        <div className="journey-shade" />
        <div className="journey-copy" key={stage}>
          <div className="journey-text">
            <p className="journey-stage-label sr-only">0{stage + 1} / 05 · {s.name}</p>
            <h2
              aria-label={s.title}
              className={stage === 0 ? "hero-title" : "stage-title"}
            >
              {stage === 0 ? (
                <>
                  <span>From Raw <em>Steel</em></span>{" "}
                  <span>to Extraordinary</span>{" "}
                  <span>Engineering.</span>
                </>
              ) : (
                s.title
              )}
            </h2>
          </div>
          <div className="journey-support"><p>{s.copy}</p></div>
          <div className="hero-actions"><a href="#products" className="button button-light" aria-label="Explore Our Products"><RollingText>Explore Our Products</RollingText><ArrowUpRight size={20}/></a><a href="#enquiry-form" className="button button-outline" aria-label="Discuss Your Project"><RollingText>Discuss Your Project</RollingText><ArrowUpRight size={20}/></a></div>
        </div>
        <div className="journey-bottom">
          <div className="stage-rail" aria-label="Manufacturing stages">
            {journeyStages.map((item, i) => (
              <button type="button" onClick={() => chooseStage(item)} aria-label={`Show ${item.name} manufacturing stage`}
                key={item.name}
                className={stage === i ? "active" : ""}
                aria-current={stage === i ? "step" : undefined}
              >
                <span className="stage-number">0{i + 1}</span> {item.name}
              </button>
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
