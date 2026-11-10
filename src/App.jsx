import { useCallback, useEffect, useState } from "react";
import SiteMotion from "./components/SiteMotion";
import Header from "./components/Header";
import ManufacturingJourney from "./components/ManufacturingJourney";
import ProcessStudio from "./components/ProcessStudio";
import ProductShowroom from "./components/ProductShowroom";
import Enquiry from "./components/Enquiry";
import WorkshopWidget from "./components/WorkshopWidget";
import PageLoading from "./components/PageLoading";
import usePageReadiness from "./lib/use-page-readiness";
import CompanyStory from "./components/CompanyStory";
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
    const frame = requestAnimationFrame(() => {
      window.dispatchEvent(new Event("fastrack:intro-complete"));
      const hash = window.location.hash;
      if (["#products", "#enquiry-form", "#enquiry", "#studio", "#about"].includes(hash)) {
        const target = document.getElementById(hash.slice(1));
        target?.scrollIntoView({ behavior: "instant", block: "start" });
        if (hash === "#enquiry-form") target?.focus({ preventScroll: true });
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [loadingOpen]);
  const [process, setProcess] = useState(0),
    [requirement, setRequirement] = useState(""),
    [configurationDetails, setConfigurationDetails] = useState("");
  function enquire(name, summary = "") {
    setConfigurationDetails(summary);
    setRequirement(name);
    document
      .getElementById("enquiry-form")
      .scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
    requestAnimationFrame(() => document.getElementById("enquiry-form")?.focus({ preventScroll: true }));
  }
  useEffect(() => {
    const incoming = new URLSearchParams(window.location.search).get("requirement");
    if (incoming) setRequirement(incoming);
  }, []);
  return (
    <>
      {loadingOpen && <PageLoading key={`opening-${revealKey}`} loading={loading} replay={revealKey > 0} onComplete={finishOpening} />}
      <div className="site-content" inert={loadingOpen ? true : undefined}>
      <Header />
      <SiteMotion />
      <main id="home">
        <h1 className="sr-only">Stainless-steel kitchen equipment and fabrication in Sharjah</h1>
        <ManufacturingJourney onReady={markSceneReady} />
        <ProcessStudio selected={process} setSelected={setProcess} onEnquire={enquire} />
        <CompanyStory />
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
