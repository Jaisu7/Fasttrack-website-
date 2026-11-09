import { useCallback, useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import SiteMotion from "./components/SiteMotion";
import Header from "./components/Header";
import ManufacturingJourney from "./components/ManufacturingJourney";
import ProcessStudio from "./components/ProcessStudio";
import ProductShowroom from "./components/ProductShowroom";
import Enquiry from "./components/Enquiry";
import WorkshopWidget from "./components/WorkshopWidget";
import PageLoading from "./components/PageLoading";
import usePageReadiness from "./lib/use-page-readiness";
export default function App() {
  const [revealKey, setRevealKey] = useState(0);
  const [loadingOpen, setLoadingOpen] = useState(true);
  const [sceneReady, setSceneReady] = useState(false);
  const loading = usePageReadiness(sceneReady);
  const markSceneReady = useCallback(() => setSceneReady(true), []);
  const finishOpening = useCallback(() => setLoadingOpen(false), []);
  const replayIntro = useCallback(() => {
    document.getElementById("manufacturing")?.scrollIntoView({ behavior: "instant" });
    setRevealKey(key => key + 1);
    setLoadingOpen(true);
  }, []);
  useEffect(() => {
    if (loadingOpen) return;
    const frame = requestAnimationFrame(() => window.dispatchEvent(new Event("fastrack:intro-complete")));
    return () => cancelAnimationFrame(frame);
  }, [loadingOpen]);
  const [process, setProcess] = useState(0),
    [requirement, setRequirement] = useState(""),
    [configurationDetails, setConfigurationDetails] = useState("");
  function enquire(name, summary = "") {
    setConfigurationDetails(summary);
    setRequirement(name);
    document
      .getElementById("enquiry")
      .scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
  }
  return (
    <>
      {loadingOpen && <PageLoading key={`opening-${revealKey}`} loading={loading} replay={revealKey > 0} onComplete={finishOpening} />}
      <div className="site-content" inert={loadingOpen ? true : undefined}>
      <Header />
      <SiteMotion />
      <main id="home">
        <ManufacturingJourney onReady={markSceneReady} />
        <ProcessStudio selected={process} setSelected={setProcess} onEnquire={enquire} />
        <div id="about" className="about-line section">
          <p>
            Fastrack Metallic brings stainless-steel fabrication, commercial
            kitchen equipment and custom retail solutions together. Share a
            drawing, a layout or an idea. We’ll help define the next step.
          </p>
          <a href="#enquiry" className="text-link">
            Start a conversation <ArrowUpRight size={20} />
          </a>
        </div>
        <ProductShowroom onEnquire={enquire} />
        <Enquiry requirement={requirement} setRequirement={setRequirement} configurationDetails={configurationDetails} onReplayIntro={replayIntro} />
      </main>
      <WorkshopWidget
        onSelect={(i) => {
          setProcess(i);
          document
            .getElementById("studio")
            .scrollIntoView({ behavior: "smooth" });
        }}
      />
      </div>
    </>
  );
}
