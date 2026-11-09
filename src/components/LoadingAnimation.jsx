import { useId } from "react";
import originalMark from "../lib/brand-mark.json";

const createMarkPath = (left, top) => originalMark.map(contour => contour.map(([x, y], index) =>
  `${index ? "L" : "M"}${(left + x * 102).toFixed(1)},${(top + y * 66).toFixed(1)}`,
).join(" ") + " Z").join(" ");
const markPath = createMarkPath(321, 159);
const cuttingPath = createMarkPath(0, 0);

// Native SVG/CSS motion: no video, new dependency or per-frame React renders.
function WorkshopIllustration() {
  const id = useId().replaceAll(":", "");
  return (
    <svg className="workshop-illustration" viewBox="0 0 600 330" aria-hidden="true">
      <defs>
        <clipPath id={`${id}-intro-guard-clip`}><rect x="258" y="99" width="244" height="143" rx="9" /></clipPath>
        <linearGradient id={`${id}-intro-steel`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#dbe8df" />
          <stop offset=".45" stopColor="#a9bfb3" />
          <stop offset=".52" stopColor="#e2ece5" />
          <stop offset="1" stopColor="#9fb5aa" />
        </linearGradient>
        <linearGradient id={`${id}-intro-window`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#1b4338" />
          <stop offset="1" stopColor="#102b24" />
        </linearGradient>
        <radialGradient id={`${id}-intro-glow`}>
          <stop stopColor="#ffdb8d" stopOpacity=".6" />
          <stop offset="1" stopColor="#ffdb8d" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx="316" cy="293" rx="238" ry="14" fill="#03120d" opacity=".45" />
      <path d="M68 294H550" stroke="#426454" strokeWidth="2" strokeLinecap="round" />
      <path d="M92 71V100M78 86H107M511 68V89M501 79H522" stroke="#86b59b" strokeWidth="2" opacity=".45" />

      {/* Enclosed CNC machine, with all cutting activity behind the guard. */}
      <path d="M241 95Q241 81 255 81H505Q519 81 519 95V255H241Z" fill="#d7e3d9" stroke="#0a2118" strokeWidth="5" strokeLinejoin="round" />
      <rect x="258" y="99" width="244" height="143" rx="9" fill={`url(#${id}-intro-window)`} stroke="#10291f" strokeWidth="5" />
      <path d="M258 205H502" stroke="#3f6150" strokeWidth="2" />
      {[278, 300, 322, 344, 366, 388, 410, 432, 454, 476].map(x =>
        <path key={x} d={`M${x} 198v36`} stroke="#6a8b75" strokeWidth="3" opacity=".45" />,
      )}
      <path d="M301 148L436 148L453 231H287Z" fill={`url(#${id}-intro-steel)`} stroke="#769584" strokeWidth="2" />
      <path d={markPath} fill="none" stroke="#6d8d7b" strokeWidth="1" opacity=".4" fillRule="evenodd" />
      <path className="intro-cut-line" d={markPath} pathLength="1" fill="none" stroke="#ffd68b" strokeWidth="2" strokeLinejoin="round" />
      <path className="intro-cut-mark" d={markPath} fill="#0f6c46" fillRule="evenodd" />
      <g clipPath={`url(#${id}-intro-guard-clip)`}><g transform="translate(321 159)"><g className="intro-cutting-head">
        <animateMotion dur="1.8s" repeatCount="indefinite" path={cuttingPath} keyPoints="0;0;1;1" keyTimes="0;.1;.9;1" calcMode="linear" />
        <circle r="24" fill={`url(#${id}-intro-glow)`} />
        <path d="M0-44V-13" stroke="#839b8d" strokeWidth="12" />
        <rect x="-12" y="-40" width="24" height="20" rx="4" fill="#d6e1d7" stroke="#183727" strokeWidth="2" />
        <path d="M-7-20H7L3-8H-3Z" fill="#d59a56" stroke="#183727" strokeWidth="1.5" />
        <path d="M0-8V0" stroke="#fff4bd" strokeWidth="2" />
        <g className="intro-sparks" stroke="#ffd68b" strokeWidth="2" strokeLinecap="round">
          <path d="M-5 3L-15 10M6 3L17 8M-2 6L-6 17M3 6L10 18" />
        </g>
        <circle r="2.5" fill="#fff9d7" />
      </g></g></g>
      <path d="M270 111L289 111M475 111H489" stroke="#8eb69b" strokeWidth="2" opacity=".55" />
      <path d="M270 115L301 139M470 113L489 130" stroke="#e1f4de" strokeWidth="4" strokeLinecap="round" opacity=".12" />
      <rect x="241" y="247" width="278" height="27" rx="5" fill="#7aa48b" stroke="#0a2118" strokeWidth="5" />
      <path d="M261 274V289H284V274M477 274V289H500V274" fill="#355a43" stroke="#0a2118" strokeWidth="4" />
      <rect x="454" y="254" width="48" height="10" rx="3" fill="#173e2c" />
      <circle className="intro-machine-light" cx="491" cy="258.5" r="2.5" fill="#a1f0ab" />
      <path d="M259 259H289" stroke="#e2eee2" strokeWidth="3" strokeLinecap="round" />

      {/* Operator at the control console. */}
      <path d="M187 158H225L237 187H184Z" fill="#719c82" stroke="#0a2118" strokeWidth="5" strokeLinejoin="round" />
      <path d="M192 165H220L226 179H190Z" fill="#152e24" />
      <path className="intro-console-line" d="M196 169H215M195 174H207" stroke="#a2edaf" strokeWidth="2" strokeLinecap="round" />
      <path d="M205 188V269M190 271H222" stroke="#537c61" strokeWidth="7" strokeLinecap="round" />
      <g className="intro-operator">
        <path d="M133 221L128 279H148L159 231L169 279H189L180 218" fill="#203f34" stroke="#0a2118" strokeWidth="5" strokeLinejoin="round" />
        <path d="M126 277H149V291H118Q115 283 126 277M168 277H189L199 287Q200 291 194 291H168Z" fill="#e2be80" stroke="#0a2118" strokeWidth="4" />
        <path d="M139 139Q116 143 116 165L120 218Q150 232 182 218L184 165Q182 146 165 141Z" fill="#4b9b6c" stroke="#0a2118" strokeWidth="5" strokeLinejoin="round" />
        <path d="M151 151V219M126 192H140V207H126M161 192H175V207H161" fill="none" stroke="#1f6240" strokeWidth="3" />
        <path d="M145 133V147Q152 156 161 146V130" fill="#c58a61" stroke="#0a2118" strokeWidth="4" />
        <path d="M130 103Q130 81 151 81Q174 81 176 104V116Q175 136 156 139Q137 139 133 123" fill="#dcaa7b" stroke="#0a2118" strokeWidth="4" />
        <path d="M134 103L134 117Q127 117 127 110Q127 102 134 103" fill="#c88d63" stroke="#0a2118" strokeWidth="3" />
        <path d="M134 98Q142 94 143 87L171 97" fill="#243c2c" stroke="#0a2118" strokeWidth="4" />
        <path d="M125 94Q124 66 150 65Q176 65 181 94Z" fill="#e4bc74" stroke="#0a2118" strokeWidth="4" />
        <path d="M151 68V86M120 94H185" fill="none" stroke="#0a2118" strokeWidth="4" strokeLinecap="round" />
        <path d="M141 106H157L159 117H143ZM158 106H173V115L162 118Z" fill="#b6d9b6" stroke="#173728" strokeWidth="2.5" />
        <path d="M157 125Q162 128 167 123" fill="none" stroke="#6d4532" strokeWidth="2" strokeLinecap="round" />
        <path d="M128 157Q112 169 119 192L125 202" fill="none" stroke="#0a2118" strokeWidth="18" strokeLinecap="round" />
        <path d="M128 157Q112 169 119 192L125 202" fill="none" stroke="#4b9b6c" strokeWidth="10" strokeLinecap="round" />
        <path d="M125 198L130 209" stroke="#e4bc74" strokeWidth="12" strokeLinecap="round" />
        <g className="intro-operator-arm">
          <path d="M173 157L183 177L201 170" fill="none" stroke="#0a2118" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M173 157L183 177L201 170" fill="none" stroke="#4b9b6c" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M199 171L208 167" stroke="#e4bc74" strokeWidth="12" strokeLinecap="round" />
        </g>
      </g>
      <path d="M75 270H103L108 292H70Z" fill="#527457" stroke="#0a2118" strokeWidth="3" />
      <path d="M88 271V243M88 259Q74 258 76 248Q87 247 88 259M88 251Q103 249 99 240Q90 240 88 251" fill="#8fbc7c" stroke="#0a2118" strokeWidth="3" strokeLinejoin="round" />
    </svg>
  );
}

export const loadingOptions = [
  { id: "laser", name: "Laser workshop" },
  { id: "bend", name: "Steel folding" },
  { id: "weld", name: "Welding sparks" },
  { id: "shelf", name: "Shelf assembly" },
  { id: "cabinet", name: "Cabinet rotation" },
  { id: "logo", name: "Logo trace" },
];

function Scene({ children }) {
  const id = useId().replaceAll(":", "");
  return (
    <svg className="loading-scene" viewBox="0 0 360 230" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#eff6ed" /><stop offset=".35" stopColor="#9ab7a7" /><stop offset=".53" stopColor="#d8e9dc" /><stop offset="1" stopColor="#688a78" />
        </linearGradient>
      </defs>
      <ellipse cx="180" cy="210" rx="130" ry="9" fill="#071811" opacity=".65" />
      <path d="M36 210H324" stroke="#365c48" strokeWidth="1.5" />
      {children(`url(#${id}-metal)`)}
    </svg>
  );
}

function Bending() {
  return <Scene>{metal => <g stroke="#0a2118" strokeWidth="3" strokeLinejoin="round">
    <path d="M72 64H288V192H264V105H96V192H72Z" fill="#759b83" />
    <rect x="65" y="188" width="230" height="17" rx="4" fill="#365e47" />
    <rect x="94" y="164" width="172" height="22" rx="3" fill={metal} />
    <path d="M146 164L180 184L214 164" fill="#16392a" />
    <path d="M98 165H180L247 165" fill="none" stroke="#dcf2e1" strokeWidth="5" />
    <g className="loading-fold-sheet"><path d="M180 165H254" stroke="#c5e3cd" strokeWidth="5" /></g>
    <g className="loading-press">
      <rect x="94" y="63" width="172" height="45" rx="4" fill={metal} />
      <path d="M164 108H196L180 136Z" fill="#dbba79" />
      <path d="M109 75H144" stroke="#658672" strokeWidth="3" />
    </g>
    <rect x="267" y="116" width="21" height="40" rx="3" fill="#123626" />
    <circle cx="277.5" cy="128" r="3" fill="#a8e9a8" stroke="none" />
    <path d="M273 139H282M273 145H282" stroke="#719d7c" strokeWidth="2" />
    <path d="M74 205V212M285 205V212" stroke="#759b83" strokeWidth="8" />
  </g>}</Scene>;
}

function Welding() {
  return <Scene>{metal => <g stroke="#0a2118" strokeWidth="3" strokeLinejoin="round">
    <path d="M170 140L255 116L294 139L208 164Z" fill={metal} />
    <path d="M170 140V169L208 190V164M208 190L294 165V139" fill="#7c9d8b" />
    <path d="M183 163V203M279 171V203M208 190V208" stroke="#a7bcae" strokeWidth="7" />
    <rect x="58" y="185" width="74" height="19" rx="5" fill="#65886d" />
    <path d="M72 185V168Q72 156 86 156H104Q117 156 117 168V185" fill="#a6bd9f" />
    <g className="loading-weld-arm">
      <path d="M96 166L99 110L153 84L195 124" fill="none" stroke="#102b1e" strokeWidth="23" strokeLinecap="round" />
      <path d="M96 166L99 110L153 84L195 124" fill="none" stroke="#81ae83" strokeWidth="15" strokeLinecap="round" />
      <circle cx="99" cy="110" r="11" fill="#dce6d0" /><circle cx="153" cy="84" r="10" fill="#dce6d0" />
      <path d="M190 118L207 134L202 143L191 133Z" fill="#caaa74" />
      <path d="M202 143L210 150" stroke="#e8e4c3" strokeWidth="3" />
    </g>
    <path className="loading-weld-seam" d="M207 148L252 136" fill="none" stroke="#ffdaa2" strokeWidth="2.5" pathLength="1" />
    <g className="loading-weld-flash" transform="translate(214 147)" stroke="none">
      <circle r="26" fill="#c9f4ff" opacity=".12" /><circle r="12" fill="#ceefff" opacity=".22" /><circle r="4" fill="#f7ffff" />
      <path d="M-8-4L-21-12M8-5L18-17M-3 8L-12 21M9 4L23 11M4-9L6-23" stroke="#ffd69c" strokeWidth="2" strokeLinecap="round" />
    </g>
    <path d="M64 185Q34 120 93 109" fill="none" stroke="#183b29" strokeWidth="5" />
  </g>}</Scene>;
}

function Shelf() {
  return <Scene>{metal => <g className="loading-shelf-turn" stroke="#0b261a" strokeWidth="2" strokeLinejoin="round">
    <g className="loading-shelf-frame">
      <path d="M102 58V194M147 78V214M254 45V183M299 66V203" stroke="#abc7b2" strokeWidth="6" />
      <path d="M102 58L147 78L299 66L254 45Z" fill="none" stroke="#6d9179" strokeWidth="3" />
    </g>
    {[0, 1, 2, 3].map(i => <g className={`loading-shelf-tier loading-shelf-tier-${i}`} key={i}>
      <path d={`M99 ${57+i*42}L254 ${44+i*42}L302 ${65+i*42}L147 ${80+i*42}Z`} fill={metal} />
      <path d={`M99 ${57+i*42}V${64+i*42}L147 ${87+i*42}L302 ${72+i*42}V${65+i*42}L147 ${80+i*42}Z`} fill="#638772" />
      <path d={`M147 ${80+i*42}L302 ${65+i*42}`} stroke="#eff6e9" strokeWidth="1.5" />
    </g>)}
    <path d="M102 64V194M147 87V214M299 72V203" fill="none" stroke="#b1cab8" strokeWidth="4" />
  </g>}</Scene>;
}

function Cabinet() {
  return <div className="loading-cabinet-stage" aria-hidden="true">
    <div className="loading-cabinet-shadow" />
    <div className="loading-cabinet">
      <div className="loading-cabinet-front"><div className="loading-cabinet-header" /><div className="loading-cabinet-doors"><i /><i /></div><span className="loading-cabinet-leg leg-left" /><span className="loading-cabinet-leg leg-right" /></div>
      <div className="loading-cabinet-back"><span className="loading-cabinet-vents" /></div>
      <div className="loading-cabinet-left" /><div className="loading-cabinet-right" /><div className="loading-cabinet-top" />
    </div>
  </div>;
}

const logoPath = createMarkPath(129, 76);
function Logo() {
  const id = useId().replaceAll(":", "");
  return <svg className="loading-scene" viewBox="0 0 360 230" aria-hidden="true">
    <defs><linearGradient id={`${id}-logo-metal`}><stop stopColor="#7da68d" /><stop offset=".5" stopColor="#e1f3dc" /><stop offset="1" stopColor="#7da68d" /></linearGradient></defs>
    <circle className="loading-logo-ring" cx="180" cy="110" r="74" fill="none" stroke="#5f967a" strokeWidth=".8" strokeDasharray="3 9" />
    <path d={logoPath} fill="#45715a" fillRule="evenodd" opacity=".12" />
    <path className="loading-logo-outline" d={logoPath} pathLength="1" fill="none" stroke={`url(#${id}-logo-metal)`} strokeWidth="1.8" />
    <path className="loading-logo-fill" d={logoPath} fill="#82c5a1" fillRule="evenodd" />
    <path d="M147 196H213" stroke="#49745b" strokeWidth="1" />
    <circle className="loading-logo-dot" cx="180" cy="196" r="2" fill="#b9dfa7" />
  </svg>;
}

export default function LoadingAnimation({ variant = "laser" }) {
  return <div className={`loading-animation loading-animation-${variant}`} aria-hidden="true">
    {variant === "laser" ? <WorkshopIllustration /> :
      variant === "bend" ? <Bending /> :
      variant === "weld" ? <Welding /> :
      variant === "shelf" ? <Shelf /> :
      variant === "cabinet" ? <Cabinet /> : <Logo />}
  </div>;
}
