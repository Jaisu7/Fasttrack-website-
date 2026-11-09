import { useEffect, useState } from "react";

// Track the resources needed for the first screen. Equipment further down the
// page remains lazy-loaded and never holds up navigation or the enquiry form.
export default function usePageReadiness(sceneReady) {
  const [fontsReady, setFontsReady] = useState(false);
  const [imageReady, setImageReady] = useState(false);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    let alive = true;
    const settleFonts = () => { if (alive) setFontsReady(true); };
    Promise.resolve(document.fonts?.ready).then(settleFonts, settleFonts);

    const image = document.querySelector(".journey-fallback");
    const settleImage = () => {
      const decoded = image?.naturalWidth && image.decode ? image.decode() : Promise.resolve();
      Promise.resolve(decoded).catch(() => {}).then(() => { if (alive) setImageReady(true); });
    };
    if (!image || image.complete) settleImage();
    else {
      image.addEventListener("load", settleImage, { once: true });
      image.addEventListener("error", settleImage, { once: true });
    }
    // A slow or failed enhancement must not leave a permanent loading effect.
    const timer = window.setTimeout(() => setExpired(true), 8000);
    return () => {
      alive = false;
      clearTimeout(timer);
      image?.removeEventListener("load", settleImage);
      image?.removeEventListener("error", settleImage);
    };
  }, []);

  const completed = Number(fontsReady) + Number(imageReady) + Number(sceneReady);
  return { completed, total: 3, progress: completed / 3, pending: completed < 3 && !expired, expired };
}
