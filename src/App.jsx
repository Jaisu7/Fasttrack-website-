import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import SiteMotion from "./components/SiteMotion";
import Header from "./components/Header";
import ManufacturingJourney from "./components/ManufacturingJourney";
import ProcessStudio from "./components/ProcessStudio";
import ProductShowroom from "./components/ProductShowroom";
import Enquiry from "./components/Enquiry";
import WorkshopWidget from "./components/WorkshopWidget";
export default function App() {
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
      <Header />
      <SiteMotion />
      <main id="home">
        <ManufacturingJourney />
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
        <Enquiry requirement={requirement} setRequirement={setRequirement} configurationDetails={configurationDetails} />
      </main>
      <WorkshopWidget
        onSelect={(i) => {
          setProcess(i);
          document
            .getElementById("studio")
            .scrollIntoView({ behavior: "smooth" });
        }}
      />
    </>
  );
}
