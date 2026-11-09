import { useEffect, useRef, useState } from "react";

// Native lazy-loading can fetch images several screens ahead. Wait until the
// actual equipment/gallery is close, while reserving its existing dimensions.
export default function DeferredImage({ src, ...props }) {
  const ref = useRef(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setNear(true);
      observer.disconnect();
    }, { rootMargin: "400px" });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return <img {...props} ref={ref} src={near ? src : undefined} data-src={src} loading="lazy" decoding="async" />;
}
