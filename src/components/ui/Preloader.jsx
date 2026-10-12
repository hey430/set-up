import { useEffect, useRef, useState } from 'react'
import { gsap, useGSAP, EASE } from '../../lib/gsap'
import { prefersReducedMotion } from '../../lib/env'

const MIN_DURATION = 1.4 // seconds, so the counter never flashes
const MAX_WAIT = 7000 // ms, never block the site on a slow asset

/**
 * Minimal 0 → 100 counter that follows real asset progress (fonts, portrait,
 * WebGL scene), then exits with a curtain (clip-path) reveal.
 *
 * @param {number}   progress  0..1 real loading progress
 * @param {Function} onDone    called once the curtain has lifted
 */
export default function Preloader({ progress, onDone }) {
  const root = useRef(null)
  const counterRef = useRef(null)
  const barRef = useRef(null)
  const shown = useRef({ value: 0 })
  const startTime = useRef(performance.now())
  const [finished, setFinished] = useState(false)
  const [forced, setForced] = useState(false)

  // Take over from the static HTML preloader in index.html
  useEffect(() => {
    document.getElementById('boot')?.remove()
  }, [])

  // Safety net
  useEffect(() => {
    const id = setTimeout(() => setForced(true), MAX_WAIT)
    return () => clearTimeout(id)
  }, [])

  const target = forced ? 1 : progress

  // Ease the displayed number toward real progress
  useGSAP(
    () => {
      const elapsed = (performance.now() - startTime.current) / 1000
      const remainingMin = Math.max(0.35, MIN_DURATION - elapsed)
      gsap.to(shown.current, {
        value: target * 100,
        duration: target >= 1 ? remainingMin : 0.9,
        ease: 'power2.out',
        overwrite: true,
        onUpdate: () => {
          const v = Math.round(shown.current.value)
          if (counterRef.current) counterRef.current.textContent = String(v).padStart(3, '0')
          if (barRef.current) barRef.current.style.transform = `scaleX(${v / 100})`
        },
        onComplete: () => {
          if (target >= 1) setFinished(true)
        },
      })
    },
    { dependencies: [target], scope: root },
  )

  // Curtain exit
  useGSAP(
    () => {
      if (!finished) return
      if (prefersReducedMotion()) {
        gsap.to(root.current, { autoAlpha: 0, duration: 0.3, onComplete: onDone })
        return
      }
      const tl = gsap.timeline({ onComplete: onDone })
      tl.to('[data-pre-fade]', { yPercent: -120, duration: 0.6, ease: EASE.out, stagger: 0.05 })
        .to(root.current, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.2, ease: EASE.inOut }, '-=0.2')
    },
    { dependencies: [finished], scope: root },
  )

  return (
    <div
      ref={root}
      className="fixed inset-0 z-[90] flex flex-col justify-between bg-paper p-[var(--gutter)]"
      style={{ clipPath: 'inset(0% 0% 0% 0%)' }}
      role="status"
      aria-live="polite"
      aria-label="Loading site"
    >
      <div className="overflow-hidden">
        <p data-pre-fade className="font-display text-2xl tracking-tight">
          RF<span className="text-terracotta">.</span>
        </p>
      </div>

      <div>
        <div className="flex items-end justify-between gap-6 overflow-hidden">
          <p data-pre-fade className="font-display text-[clamp(4rem,14vw,11rem)] leading-none tracking-tightest">
            <span ref={counterRef} className="tabular-nums">000</span>
            <span className="text-terracotta">%</span>
          </p>
          <p data-pre-fade className="hidden pb-4 text-right text-fluid-sm text-muted md:block">
            Rameesha Fatima
            <br />
            People &amp; Culture
          </p>
        </div>
        <div className="mt-6 h-px w-full bg-stone">
          <div ref={barRef} className="h-px w-full origin-left bg-terracotta" style={{ transform: 'scaleX(0)' }} />
        </div>
      </div>
    </div>
  )
}
