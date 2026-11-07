import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import Header from "./components/Header";
import ManufacturingJourney from "./components/ManufacturingJourney";
import ProcessStudio from "./components/ProcessStudio";
import ProductShowroom from "./components/ProductShowroom";
import Enquiry from "./components/Enquiry";
import WorkshopWidget from "./components/WorkshopWidget";
export default function App() {
  const [process, setProcess] = useState(0),
    [requirement, setRequirement] = useState("");
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (preference.matches) return;
    const elements = document.querySelectorAll(".reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
      },
      { threshold: 0.1 },
    );
    elements.forEach((el) => {
      el.classList.add("reveal-pending");
      observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);
  function enquire(name) {
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
      <main id="home">
        <ManufacturingJourney />
        <ProcessStudio selected={process} setSelected={setProcess} />
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
        <Enquiry requirement={requirement} setRequirement={setRequirement} />
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
