import { useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { gsap, EASE } from '../../lib/gsap'
import { startScroll, stopScroll } from '../../lib/scroll'
import { prefersReducedMotion } from '../../lib/env'
import { useFocusTrap } from '../../hooks/useFocusTrap'

/**
 * Full-screen case study: problem → approach → outcome.
 * Accessible modal dialog: focus trap, Escape to close, focus restored.
 */
export default function CaseStudyOverlay({ item, index, onClose }) {
  const root = useRef(null)
  const panel = useRef(null)
  const closing = useRef(false)

  const close = useCallback(() => {
    if (closing.current) return
    closing.current = true
    if (prefersReducedMotion()) {
      onClose()
      return
    }
    gsap
      .timeline({ onComplete: onClose })
      .to('[data-cs-item]', { autoAlpha: 0, y: -12, duration: 0.3, stagger: 0.02, ease: 'power2.in' }, 0)
      .to(root.current, { clipPath: 'inset(100% 0% 0% 0%)', duration: 0.8, ease: EASE.inOut }, 0.1)
  }, [onClose])

  useFocusTrap(root, true, close)

  useEffect(() => {
    stopScroll()
    if (!prefersReducedMotion()) {
      const ctx = gsap.context(() => {
        gsap
          .timeline()
          .fromTo(root.current, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1, ease: EASE.inOut })
          .from('[data-cs-item]', { autoAlpha: 0, y: 28, duration: 0.9, ease: EASE.out, stagger: 0.06 }, '-=0.45')
      }, root)
      return () => {
        ctx.revert()
        startScroll()
      }
    }
    return () => startScroll()
  }, [])

  const { caseStudy: cs } = item

  // Portalled to <body> so it sits above the fixed header
  return createPortal(
    <div
      ref={root}
      role="dialog"
      aria-modal="true"
      aria-labelledby="case-title"
      className="fixed inset-0 z-[85] bg-paper"
    >
      <div ref={panel} className="h-full overflow-y-auto overscroll-contain" data-lenis-prevent>
        <div className="container-site relative py-24 md:py-28">
          <button
            type="button"
            onClick={close}
            data-cursor="Close"
            className="btn-ghost fixed right-[var(--gutter)] top-5 z-10 bg-paper"
          >
            Close <span aria-hidden="true">✕</span>
          </button>

          <div className="grid gap-12 md:grid-cols-12">
            <header className="md:col-span-5">
              <p data-cs-item className="eyebrow">
                Case study {String(index + 1).padStart(2, '0')}
              </p>
              <h2 id="case-title" data-cs-item className="mt-6 font-display text-fluid-4xl font-light tracking-tightest">
                {item.title}
              </h2>
              <p data-cs-item className="mt-4 text-fluid-base text-muted">
                {item.org}
              </p>
              <p data-cs-item className="mt-8 font-display text-fluid-xl font-light italic text-ink/85">
                {item.summary}
              </p>
            </header>

            <div className="space-y-14 md:col-span-6 md:col-start-7">
              <section data-cs-item aria-labelledby="cs-problem">
                <h3 id="cs-problem" className="flex items-center gap-3 font-sans text-fluid-xs font-medium uppercase tracking-[0.18em] text-terracotta-deep">
                  <span className="tabular-nums">01</span> The problem
                </h3>
                <p className="mt-4 text-fluid-lg text-ink/85">{cs.problem}</p>
              </section>

              <section data-cs-item aria-labelledby="cs-approach">
                <h3 id="cs-approach" className="flex items-center gap-3 font-sans text-fluid-xs font-medium uppercase tracking-[0.18em] text-terracotta-deep">
                  <span className="tabular-nums">02</span> The approach
                </h3>
                <ol className="mt-4 space-y-4">
                  {cs.approach.map((step, i) => (
                    <li key={i} className="flex gap-4 border-t border-ink/10 pt-4 text-fluid-base text-ink/85">
                      <span aria-hidden="true" className="mt-1 h-2 w-2 shrink-0 rounded-full bg-terracotta" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </section>

              <section data-cs-item aria-labelledby="cs-outcome" className="rounded-3xl bg-teal p-8 text-paper md:p-10">
                <h3 id="cs-outcome" className="flex items-center gap-3 font-sans text-fluid-xs font-medium uppercase tracking-[0.18em] text-teal-soft">
                  <span className="tabular-nums">03</span> The outcome
                </h3>
                <p className="mt-4 font-display text-fluid-xl font-light">{cs.outcome}</p>
                <ul className="mt-6 space-y-2 text-fluid-sm text-paper/85">
                  {item.outcomes.map((o, i) => (
                    <li key={i} className="flex gap-3">
                      <span aria-hidden="true">→</span>
                      {o}
                    </li>
                  ))}
                </ul>
              </section>

              <div data-cs-item>
                <button type="button" onClick={close} className="btn-primary">
                  Back to initiatives
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
