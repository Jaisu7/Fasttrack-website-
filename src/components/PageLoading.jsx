import { useCallback, useEffect, useRef, useState } from "react";
import BrandReveal from "./BrandReveal";
import usePopup from "../lib/use-popup";
import "../styles/page-loading.css";

export default function PageLoading({ loading, replay = false, onComplete }) {
  const root = useRef(null);
  const completed = useRef(false);
  const returning = useRef(false);
  const [minimumElapsed, setMinimumElapsed] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const finish = useCallback(() => {
    if (completed.current) return;
    completed.current = true;
    try { sessionStorage.setItem("fastrack-opening-seen", "1"); } catch {}
    setLeaving(true);
  }, []);
  usePopup(root, finish);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    try { returning.current = !replay && sessionStorage.getItem("fastrack-opening-seen") === "1"; } catch {}
    const minimum = window.setTimeout(() => setMinimumElapsed(true), reduced || returning.current ? 0 : replay ? 2800 : 1500);
    const maximum = window.setTimeout(finish, 3500);
    return () => { clearTimeout(minimum); clearTimeout(maximum); };
  }, [finish, replay]);
  useEffect(() => {
    if (minimumElapsed && (!loading.pending || (returning.current && loading.essentialReady))) finish();
  }, [minimumElapsed, loading.pending, loading.essentialReady, finish]);
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
