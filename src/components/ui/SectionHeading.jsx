import { useRef } from 'react'
import { useGSAP } from '../../lib/gsap'
import { revealItems, revealLines } from '../../lib/animations'

/**
 * Consistent section opener: small numbered eyebrow + large serif heading
 * that reveals line by line.
 */
export default function SectionHeading({ index, eyebrow, title, id, className = '', titleClassName = '', light = false }) {
  const ref = useRef(null)

  useGSAP(
    () => {
      revealItems(ref.current.querySelector('[data-eyebrow]'), { trigger: ref.current, y: 16 })
      revealLines(ref.current.querySelector('h2'), { trigger: ref.current })
    },
    { scope: ref },
  )

  return (
    <div ref={ref} className={className}>
      <p data-eyebrow className={`eyebrow ${light ? '!text-stone' : ''}`}>
        <span className="tabular-nums">{index}</span>
        <span aria-hidden="true">/</span>
        <span>{eyebrow}</span>
      </p>
      <h2
        id={id}
        className={`mt-5 max-w-[18ch] font-display text-fluid-3xl font-light tracking-tightest ${titleClassName}`}
      >
        {title}
      </h2>
    </div>
  )
}
