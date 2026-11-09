import { useEffect } from "react";

export default function usePopup(root, onClose) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement;
    document.body.style.overflow = "hidden";
    root.current?.focus({ preventScroll: true });
    const onKey = event => {
      if (event.key === "Escape") { event.preventDefault(); onClose(); }
      if (event.key !== "Tab") return;
      const controls = [...(root.current?.querySelectorAll("button:not([disabled]), a[href], [tabindex='0']") || [])];
      const first = controls[0], last = controls.at(-1);
      if (!first) { event.preventDefault(); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === root.current)) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === root.current)) {
        event.preventDefault(); first.focus();
      }
    };
    const popup = root.current;
    popup?.addEventListener("keydown", onKey);
    return () => {
      popup?.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      requestAnimationFrame(() => {
        if (document.activeElement !== document.body && !popup?.contains(document.activeElement)) return;
        const target = previousFocus?.isConnected && previousFocus !== document.body
          ? previousFocus : document.querySelector(".site-header .brand");
        target?.focus({ preventScroll: true });
      });
    };
  }, [root, onClose]);
}
