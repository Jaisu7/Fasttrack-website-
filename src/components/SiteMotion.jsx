import { useEffect, useRef } from "react";

/** Progressive enhancement: content remains visible if motion is unavailable. */
export default function SiteMotion() {
  const progress = useRef(null);
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const animations = new Set();
    let observer, frame = 0;
    const update = () => {
      frame = 0;
      const total = document.documentElement.scrollHeight - window.innerHeight;
      progress.current?.style.setProperty("--read-progress", String(total > 0 ? window.scrollY / total : 0));
    };
    const scroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    const configure = () => {
      observer?.disconnect();
      animations.forEach(animation => animation.cancel());
      animations.clear();
      if (preference.matches || !Element.prototype.animate) return;
      observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          observer.unobserve(entry.target);
          const targets = entry.target.matches(".section-heading")
            ? entry.target.children : [entry.target];
          Array.from(targets).forEach((target, index) => {
            const animation = target.animate([
              { opacity: 0, transform: "translateY(28px)" },
              { opacity: 1, transform: "translateY(0)" },
            ], { duration: 850, delay: index * 100, easing: "cubic-bezier(.16,1,.3,1)" });
            animations.add(animation);
            animation.onfinish = () => animations.delete(animation);
          });
        });
      }, { threshold: .12 });
      document.querySelectorAll(".section-heading, .about-line, .enquiry-intro, .enquiry-form, .process-ending").forEach(target => observer.observe(target));
    };
    window.addEventListener("scroll", scroll, { passive: true });
    window.addEventListener("resize", scroll);
    preference.addEventListener("change", configure);
    configure(); update();
    return () => {
      observer?.disconnect();
      animations.forEach(animation => animation.cancel());
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scroll);
      window.removeEventListener("resize", scroll);
      preference.removeEventListener("change", configure);
    };
  }, []);
  return <div ref={progress} className="reading-progress" aria-hidden="true" />;
}
