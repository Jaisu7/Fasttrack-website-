export default function Brand({ footer = false, homeHref = "#home" }) {
  return (
    <a
      className={`brand${footer ? " brand-footer" : ""}`}
      href={homeHref}
      aria-label="Fastrack Metallic home"
    >
      <img src="/images/brand-mark.svg" width="49" height="34" alt="" />
      <span>
        Fastrack <span className="brand-sub">Metallic</span>
      </span>
    </a>
  );
}
