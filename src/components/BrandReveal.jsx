import { useId } from "react";
import contours from "../lib/brand-mark.json";

const mark = contours.map(contour => contour.map(([x, y], i) => `${i ? "L" : "M"}${(x * 512).toFixed(2)},${(y * 332).toFixed(2)}`).join(" ") + " Z").join(" ");
const bands = [0, 1, 2, 3, 4];

// The exact company mark, assembled from five brushed-steel bands.
export default function BrandReveal({ progress = 0 }) {
  const id = useId().replaceAll(":", "");
  return (
    <div className="brand-reveal" aria-hidden="true">
      <svg className="brand-forged-mark" viewBox="-44 -40 600 412" fill="none">
        <defs>
          <linearGradient id={`${id}-steel`} x1="0" y1="0" x2="512" y2="332" gradientUnits="userSpaceOnUse">
            <stop stopColor="#849e91" /><stop offset=".21" stopColor="#eaf1e8" /><stop offset=".245" stopColor="#a1b7aa" /><stop offset=".5" stopColor="#f2f4e8" /><stop offset=".61" stopColor="#91ae9f" /><stop offset=".85" stopColor="#dce9dd" /><stop offset="1" stopColor="#729680" />
          </linearGradient>
          <linearGradient id={`${id}-shine`}><stop stopColor="white" stopOpacity="0" /><stop offset=".5" stopColor="#f3ffe8" stopOpacity=".8" /><stop offset="1" stopColor="white" stopOpacity="0" /></linearGradient>
          <clipPath id={`${id}-mark`}><path d={mark} fillRule="evenodd" clipRule="evenodd" /></clipPath>
          {bands.map(i => <clipPath id={`${id}-band-${i}`} key={i}><rect x="-120" y={i * 66.4} width="752" height="66.5" /></clipPath>)}
        </defs>
        <g className="brand-registration" stroke="#7f9e8d" strokeWidth="1" opacity=".4">
          <path d="M-22 25V-16H20M492-16H534V25M-22 307V348H20M492 348H534V307" />
          <path d="M-37 166H-15M527 166H549" />
        </g>
        <path d={mark} fill="#16794e" fillOpacity=".13" fillRule="evenodd" stroke="#5fa584" strokeWidth=".7" strokeOpacity=".3" />
        {bands.map(i => <g key={i} clipPath={`url(#${id}-band-${i})`}>
          <path className="brand-forged-band" d={mark} fill={`url(#${id}-steel)`} fillRule="evenodd" stroke="#b4d3bd" strokeWidth=".7" style={{ "--band-delay": `${i * 85}ms`, "--band-offset": `${i % 2 ? 95 : -95}px` }} />
        </g>)}
        <g clipPath={`url(#${id}-mark)`}>
          <rect className="brand-forged-shine" x="-160" y="-35" width="100" height="410" fill={`url(#${id}-shine)`} transform="skewX(-16)" />
          <path d="M0 67H512M0 133H512M0 200H512M0 266H512" stroke="#10291e" strokeWidth=".5" opacity=".4" />
        </g>
      </svg>
      <div className="brand-reveal-wordmark">FASTRACK <span>METALLIC</span></div>
      <span className="brand-reveal-rule"><i style={{ transform: `scaleX(${progress})` }} /></span>
    </div>
  );
}
