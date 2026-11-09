import { useCallback, useEffect, useRef, useState } from "react";
import BrandReveal from "./BrandReveal";
import usePopup from "../lib/use-popup";
import "../styles/page-loading.css";

export default function PageLoading({ loading, replay = false, onComplete }) {
  const root = useRef(null);
  const completed = useRef(false);
  const [minimumElapsed, setMinimumElapsed] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const finish = useCallback(() => {
    if (completed.current) return;
    completed.current = true;
    setLeaving(true);
  }, []);
  usePopup(root, finish);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const minimum = window.setTimeout(() => setMinimumElapsed(true), reduced ? 100 : replay ? 2800 : 1500);
    const maximum = window.setTimeout(finish, 8500);
    return () => { clearTimeout(minimum); clearTimeout(maximum); };
  }, [finish, replay]);
  useEffect(() => {
    if (minimumElapsed && !loading.pending) finish();
  }, [minimumElapsed, loading.pending, finish]);
  useEffect(() => {
    if (!leaving) return;
    const timer = window.setTimeout(onComplete, 350);
    return () => clearTimeout(timer);
  }, [leaving, onComplete]);
  return (
    <div ref={root} className={`page-loading-layer${leaving ? " is-leaving" : ""}`} role="dialog" aria-modal="true" aria-labelledby="page-loading-title" tabIndex={-1}>
      <h2 id="page-loading-title" className="sr-only">Loading Fastrack Metallic</h2>
      <BrandReveal progress={loading.progress} />
    </div>
  );
}
