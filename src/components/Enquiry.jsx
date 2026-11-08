import { useEffect, useState } from "react";
import {
  ArrowRight,
  Mail,
  Phone,
  Copy,
  Download,
  ExternalLink,
} from "lucide-react";
import { prepareEnquiry } from "../lib/enquiry.mjs";
import Brand from "./Brand";
import { products } from "../lib/fasttrack-data";
export default function Enquiry({ requirement, setRequirement, configurationDetails = "" }) {
  const [draft, setDraft] = useState(null),
    [status, setStatus] = useState(""),
    [details, setDetails] = useState(configurationDetails);
  useEffect(() => { setDetails(configurationDetails); setDraft(null); setStatus(""); }, [configurationDetails, requirement]);
  function submit(e) {
    e.preventDefault();
    const fields = Object.fromEntries(new FormData(e.currentTarget));
    setDraft(prepareEnquiry(fields));
    setStatus("Draft prepared below. Review it before opening your email app.");
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(`${draft.subject}\n\n${draft.body}`);
      setStatus("Enquiry copied.");
    } catch {
      setStatus(
        "Copy is unavailable in this browser. Select the draft text or download it.",
      );
    }
  }
  function download() {
    const url = URL.createObjectURL(
      new Blob([`${draft.subject}\n\n${draft.body}`], {
        type: "text/plain;charset=utf-8",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "Fastrack-project-enquiry.txt";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus("Enquiry draft downloaded.");
  }
  return (
    <>
      <section id="enquiry" className="section enquiry-section">
        <div className="enquiry-intro reveal">
          <h2>
            Let’s build
            <br />
            something
            <br />
            exceptional.
          </h2>
          <p>
            Tell us what you need.
            <br />
            We’ll help shape the next step.
          </p>
          <div className="contact-links">
            <a href="mailto:info@fasttrackmi.com">
              <Mail size={24} />
              info@fasttrackmi.com
            </a>
            <a href="tel:+97165351536">
              <Phone size={24} />
              +971 6 535 1536
            </a>
          </div>
        </div>
        <form
          className="enquiry-form"
          onSubmit={submit}
          onChange={() => {
            if (draft) {
              setDraft(null);
              setStatus(
                "Details changed. Prepare a new draft to include your updates.",
              );
            }
          }}
        >
          <div className="field-grid">
            <label>
              Name
              <input
                name="name"
                autoComplete="name"
                placeholder="Your full name"
                required
                maxLength="120"
              />
            </label>
            <label>
              Email
              <input
                name="email"
                type="email"
                autoComplete="email"
                placeholder="Your email address"
                required
                maxLength="200"
              />
            </label>
            <label>
              Company
              <input
                name="company"
                autoComplete="organization"
                placeholder="Your company name"
                maxLength="160"
              />
            </label>
            <label>
              Requirement
              <select
                aria-label="Requirement"
                name="requirement"
                value={requirement}
                onChange={(e) => setRequirement(e.target.value)}
                required
              >
                <option value="">Select a requirement</option>
                {[
                  ...products.map((product) => product.name),
                  "Laser cutting",
                  "CNC punching",
                  "Bending",
                  "Welding",
                  "Laser / punching / bending / welding",
                  "Multiple equipment / project list",
                  "Other project",
                ].map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="details-label">
            Project details
            <textarea
              name="details"
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              placeholder="Tell us about your project, scope and any key requirements."
              required
              minLength="15"
              maxLength="30000"
              rows="4"
            />
          </label>
          <label className="consent">
            <input type="checkbox" name="consent" required />{" "}
            <span>I agree to be contacted about this enquiry.</span>
          </label>
          <button className="button button-light prepare-button" type="submit">
            Prepare enquiry <ArrowRight size={22} />
          </button>
          <p className="quiet form-note">
            Prepare a draft to review in your email app. Nothing is sent
            automatically.
          </p>
          <p className="form-status" role="status">
            {status}
          </p>
          {draft && (
            <div className="draft-review">
              <h3>Review your enquiry</h3>
              <pre tabIndex="0">
                {draft.subject}
                {"\n\n"}
                {draft.body}
              </pre>
              <div className="controls">
                <a className="button button-green" href={draft.mailto}>
                  Open email app <ExternalLink size={16} />
                </a>
                <button
                  className="button button-outline"
                  type="button"
                  onClick={copy}
                >
                  <Copy size={16} /> Copy
                </button>
                <button
                  className="button button-outline"
                  type="button"
                  onClick={download}
                >
                  <Download size={16} /> Download
                </button>
              </div>
            </div>
          )}
        </form>
      </section>
      <footer className="site-footer">
        <div>
          <Brand footer />
          <p>Fastrack — Engineered in Steel.</p>
        </div>
        <nav aria-label="Footer navigation">
          <a href="#manufacturing">Manufacturing</a>
          <a href="#products">Products</a>
          <a href="#enquiry">Contact</a>
        </nav>
        <small>
          Â© {new Date().getFullYear()} Fastrack Metallic. All rights reserved.
        </small>
      </footer>
    </>
  );
}
