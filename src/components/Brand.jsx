export default function Brand({ footer = false }) {
  return (
    <a
      className={`brand${footer ? " brand-footer" : ""}`}
      href="#home"
      aria-label="Fastrack Metallic home"
    >
      <img src="/images/brand-mark.svg" width="49" height="34" alt="" />
      <span>
        Fastrack <span className="brand-sub">Metallic</span>
      </span>
    </a>
  );
}
