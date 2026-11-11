import { useEffect, useRef } from 'react';
export default function SliceReveal({ src, alt, caption }) {
  const root = useRef(null);
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || !Element.prototype.animate) return;
    const animations = [];
    const observer = new IntersectionObserver(([entry]) => { if (!entry.isIntersecting) return; observer.disconnect(); root.current.querySelectorAll('.image-slice').forEach((slice, index) => animations.push(slice.animate([{ opacity: 0, transform: `translateY(${index % 2 ? -36 : 36}px)` }, { opacity: 1, transform: 'none' }], { duration: 720, delay: index * 45, easing: 'cubic-bezier(.22,1,.36,1)' }))); }, { threshold: 0.2 });
    observer.observe(root.current);
    return () => { observer.disconnect(); animations.forEach(animation => animation.cancel()); };
  }, []);
  return <figure ref={root} className="slice-reveal"><div className="slice-image"><img className="slice-accessible" src={src} alt={alt} width="963" height="539" loading="lazy"/>{Array.from({ length: 8 }, (_, index) => <span className="image-slice" key={index} aria-hidden="true" style={{ clipPath: `inset(0 ${100 - (index + 1) * 12.5}% 0 ${index * 12.5}%)` }}><img src={src} alt="" width="963" height="539" loading="lazy"/></span>)}</div><figcaption>{caption}</figcaption></figure>;
}
