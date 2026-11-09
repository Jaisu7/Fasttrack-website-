import { useCallback, useRef, useState } from "react";
import LoadingAnimation, { loadingOptions } from "./LoadingAnimation";
import WorkshopLoader from "./WorkshopLoader";
import usePopup from "../lib/use-popup";

export default function LoadingOptions({ selected, onSelect, onClose }) {
  const root = useRef(null);
  const [previewing, setPreviewing] = useState(null);
  const stopPreview = useCallback(() => setPreviewing(null), []);
  usePopup(root, onClose);
  return (
    <>
      <div className="loading-options-backdrop" inert={previewing ? true : undefined}>
        <div ref={root} className="loading-options" role="dialog" aria-modal="true" aria-labelledby="loading-options-title" tabIndex={-1}>
          <header className="loading-options-heading">
            <div><p className="loading-options-kicker">FASTRACK · LOADING ANIMATIONS</p><h2 id="loading-options-title">A little motion. Your choice.</h2></div>
            <button type="button" className="loading-close" aria-label="Close animation options" onClick={onClose}>×</button>
          </header>
          <p className="loading-options-description">Six compact popups. Preview an animation, then choose your favourite.</p>
          <div className="loading-options-grid">
            {loadingOptions.map((option, i) => (
              <article className={`loading-option${selected === option.id ? " is-selected" : ""}`} key={option.id}>
                <button className="loading-option-preview" type="button" onClick={() => setPreviewing(option.id)} aria-label={`Preview ${option.name} popup`}>
                  <LoadingAnimation variant={option.id} />
                  <span className="loading-preview-hint">▶ Preview popup</span>
                </button>
                <div className="loading-option-info"><span className="loading-option-number">0{i + 1}</span><h3>{option.name}</h3></div>
                <button className="loading-option-select" type="button" aria-pressed={selected === option.id} onClick={() => onSelect(option.id)}>
                  {selected === option.id ? "✓ Selected" : "Use this animation"}<span aria-hidden="true">↗</span>
                </button>
              </article>
            ))}
          </div>
          <div className="loading-options-footer"><span role="status">{loadingOptions.find(option => option.id === selected)?.name} selected for this browser.</span><button type="button" onClick={onClose}>Done <span aria-hidden="true">↗</span></button></div>
        </div>
      </div>
      {previewing && <WorkshopLoader key={previewing} variant={previewing} preview sceneReady onComplete={stopPreview} />}
    </>
  );
}
