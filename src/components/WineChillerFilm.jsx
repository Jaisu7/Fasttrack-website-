import { useEffect, useRef } from "react";

export default function WineChillerFilm() {
  const root = useRef(null), video = useRef(null);
  useEffect(() => {
    const element = video.current;
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        if (!element.getAttribute("src")) element.src = "/videos/wine-chiller.mp4";
        if (!preference.matches && !document.hidden) element.play().catch(() => {});
      } else element.pause();
    }, { threshold: 0.2 });
    const pause = () => { if (document.hidden || preference.matches) element.pause(); };
    observer.observe(root.current);
    document.addEventListener("visibilitychange", pause);
    preference.addEventListener("change", pause);
    return () => { observer.disconnect(); element.pause(); document.removeEventListener("visibilitychange", pause); preference.removeEventListener("change", pause); };
  }, []);
  return <div className="wine-film viewer-column" ref={root}>
    <div className="wine-film-stage">
      <img className="wine-film-backdrop" src="/images/wine-chiller.jpg" alt="" aria-hidden="true" loading="lazy" />
      <video ref={video} muted loop playsInline controls preload="none" poster="/images/wine-chiller.jpg" aria-label="Wine chiller installation video">
        Your browser does not support video. <a href="/videos/wine-chiller.mp4">Open the wine chiller film</a>.
      </video>
    </div>
    <div className="media-caption"><span>Wine Chiller · Installation film</span><span>Sound off by default</span></div>
  </div>;
}
