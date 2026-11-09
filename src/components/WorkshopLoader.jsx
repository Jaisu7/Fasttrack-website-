import { useCallback, useEffect, useRef, useState } from "react";
import LoadingAnimation from "./LoadingAnimation";
import usePopup from "../lib/use-popup";
import "../styles/workshop-loader.css";

export default function WorkshopLoader({ sceneReady, onComplete, variant = "logo", preview = false }) {
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
    const minTimer = window.setTimeout(() => setMinimumElapsed(true), reduced ? 100 : preview ? 3200 : 1800);
    const maxTimer = window.setTimeout(finish, 4500);
    return () => { clearTimeout(minTimer); clearTimeout(maxTimer); };
  }, [finish, preview]);

  useEffect(() => {
    if (minimumElapsed && sceneReady) finish();
  }, [minimumElapsed, sceneReady, finish]);

  useEffect(() => {
    if (!leaving) return;
    const timer = window.setTimeout(onComplete, 220);
    return () => clearTimeout(timer);
  }, [leaving, onComplete]);

  return (
    <div className={`loading-backdrop${leaving ? " is-leaving" : ""}`}>
      <div ref={root} className="workshop-loader" role="dialog" aria-modal="true" aria-labelledby="workshop-intro-title" tabIndex={-1}>
        <h2 id="workshop-intro-title" className="sr-only">Loading Fastrack Metallic</h2>
        <div className="workshop-loader-top">
          <div className="workshop-loader-brand"><img src="/images/brand-mark.svg" alt="" width="28" height="19" /><span>Fastrack <span>Metallic</span></span></div>
        </div>
        <LoadingAnimation variant={variant} />
        <div className="workshop-loader-status" role="status"><span className="workshop-loader-dot" />Loading<span className="workshop-loader-ellipsis">…</span></div>
        <div className="workshop-loader-track" aria-hidden="true"><span /></div>
      </div>
    </div>
  );
}
