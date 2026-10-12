/**
 * Small animated line icons for the Expertise rows. Every stroke uses
 * pathLength="1" so CSS can draw it in (see .line-icon in index.css).
 */
const ICONS = {
  compass: (
    <>
      <circle cx="16" cy="16" r="12" pathLength="1" />
      <path d="M20.5 11.5 18 18l-6.5 2.5L14 14z" pathLength="1" />
    </>
  ),
  ladder: (
    <>
      <path d="M10 4v24M22 4v24" pathLength="1" />
      <path d="M10 10h12M10 16h12M10 22h12" pathLength="1" />
    </>
  ),
  target: (
    <>
      <circle cx="16" cy="16" r="12" pathLength="1" />
      <circle cx="16" cy="16" r="6.5" pathLength="1" />
      <path d="M16 16 27 5M23 5h4v4" pathLength="1" />
    </>
  ),
  heart: <path d="M16 27S5 20.5 5 12.5A5.5 5.5 0 0 1 16 10a5.5 5.5 0 0 1 11 2.5C27 20.5 16 27 16 27z" pathLength="1" />,
  door: (
    <>
      <path d="M8 28V5h16v23M5 28h22" pathLength="1" />
      <path d="M19 16.5v1" pathLength="1" />
    </>
  ),
  chart: (
    <>
      <path d="M5 27h22" pathLength="1" />
      <path d="M8 22l6-6 4 3 8-9" pathLength="1" />
      <path d="M22 10h4v4" pathLength="1" />
    </>
  ),
  bridge: (
    <>
      <path d="M4 22h24" pathLength="1" />
      <path d="M4 22c4-10 20-10 24 0" pathLength="1" />
      <path d="M10 22v-5M16 22v-7M22 22v-5" pathLength="1" />
    </>
  ),
  globe: (
    <>
      <circle cx="16" cy="16" r="12" pathLength="1" />
      <path d="M4 16h24M16 4c4 3.5 4 20.5 0 24M16 4c-4 3.5-4 20.5 0 24" pathLength="1" />
    </>
  ),
}

export default function ExpertiseIcon({ name, className = '' }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`line-icon ${className}`}
    >
      {ICONS[name] || ICONS.compass}
    </svg>
  )
}
