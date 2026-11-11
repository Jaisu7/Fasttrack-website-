import { useEffect, useRef } from 'react';
export default function WordReveal({ children, className = '' }) {
  const root = useRef(null);
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || !Element.prototype.animate) return;
    const animations = [];
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      root.current.querySelectorAll('span').forEach((word, index) => animations.push(word.animate([{ opacity: 0.2 }, { opacity: 1 }], { duration: 500, delay: index * 30, easing: 'ease-out' })));
    }, { threshold: 0.3 });
    observer.observe(root.current);
    return () => { observer.disconnect(); animations.forEach(animation => animation.cancel()); };
  }, []);
  return <p ref={root} className={className}>{String(children).split(/(\s+)/).map((word, index) => /\s/.test(word) ? word : <span key={index}>{word}</span>)}</p>;
}
