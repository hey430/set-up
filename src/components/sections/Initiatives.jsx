import { useRef, useState } from 'react'
import { gsap, useGSAP } from '../../lib/gsap'
import { revealItems } from '../../lib/animations'
import SectionHeading from '../ui/SectionHeading'
import CaseStudyOverlay from './CaseStudyOverlay'
import { initiatives } from '../../data/content'

/**
 * Key initiatives as a pinned horizontal scroll of large editorial cards
 * (≥ 768px, motion allowed). On mobile or with reduced motion the same
 * markup becomes a simple vertical stack.
 *
 * Why horizontal over fanned 3D stacks: it reads like turning the pages of a
 * magazine, every card stays flat and legible (no skewed text), and it
 * degrades naturally into a vertical list.
 */
export default function Initiatives() {
  const root = useRef(null)
  const track = useRef(null)
  const progress = useRef(null)
  const [openIndex, setOpenIndex] = useState(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()

      mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
        const distance = () => track.current.scrollWidth - window.innerWidth
        const tween = gsap.to(track.current, {
          x: () => -distance(),
          ease: 'none',
          scrollTrigger: {
            trigger: '[data-pin]',
            start: 'top top',
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true,
            anticipatePin: 1,
            onUpdate: (self) => {
              if (progress.current) progress.current.style.transform = `scaleX(${self.progress})`
            },
          },
        })
        // Cards lift gently as they travel into view
        gsap.utils.toArray('[data-card]').forEach((card) => {
          gsap.from(card.querySelector('[data-card-inner]'), {
            y: 60,
            rotate: 1.5,
            ease: 'none',
            scrollTrigger: {
              trigger: card,
              containerAnimation: tween,
              start: 'left 100%',
              end: 'left 55%',
              scrub: true,
            },
          })
        })
      })

      mm.add('(max-width: 767px), (prefers-reduced-motion: reduce)', () => {
        revealItems('[data-card]', { stagger: 0.1 })
      })
    },
    { scope: root },
  )

  return (
    <section id="initiatives" ref={root} aria-labelledby="initiatives-title" className="relative" data-dim="1">
      <div data-pin className="relative overflow-hidden md:motion-safe:h-[100svh]">
        <div
          ref={track}
          className="flex flex-col gap-6 px-[var(--gutter)] py-24 md:motion-safe:h-full md:motion-safe:w-max md:motion-safe:flex-row md:motion-safe:items-center md:motion-safe:gap-8 md:motion-safe:py-0 md:motion-reduce:grid md:motion-reduce:grid-cols-2"
        >
          {/* Intro panel */}
          <div className="flex shrink-0 flex-col justify-center md:motion-safe:w-[min(34rem,40vw)] md:pr-10">
            <SectionHeading
              index="03"
              eyebrow="Key initiatives"
              title="Programmes that changed how people work."
              id="initiatives-title"
            />
            <p className="mt-6 max-w-[36ch] text-fluid-base text-muted">
              Six pieces of work, each a small case study. Open any card for the problem, the approach and the
              outcome.
            </p>
            <p aria-hidden="true" className="mt-10 hidden items-center gap-3 text-fluid-xs uppercase tracking-[0.18em] text-muted md:motion-safe:flex">
              Scroll <span className="inline-block h-px w-12 bg-terracotta" /> to explore
            </p>
          </div>

          {initiatives.map((item, i) => (
            <article
              key={item.id}
              data-card
              className="shrink-0 md:motion-safe:h-[min(78svh,44rem)] md:motion-safe:w-[min(32rem,78vw)] xl:motion-safe:w-[min(34rem,36vw)]"
              aria-labelledby={`init-${item.id}`}
            >
              <div
                data-card-inner
                className="group flex h-full flex-col justify-between rounded-[1.75rem] border border-stone bg-[#FBF8F4] p-7 shadow-[0_30px_60px_-40px_rgba(30,30,30,0.35)] transition-colors duration-500 hover:border-terracotta/50 md:p-9"
              >
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <span aria-hidden="true" className="font-display text-fluid-4xl font-light leading-none text-[#958C83] transition-colors duration-500 group-hover:text-terracotta">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="mt-2 rounded-full border border-ink/15 px-3 py-1 text-fluid-xs text-muted">
                      {item.org}
                    </span>
                  </div>
                  <h3 id={`init-${item.id}`} className="mt-8 font-display text-fluid-2xl font-normal tracking-tight">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-fluid-base text-ink/80">{item.summary}</p>
                </div>

                <div>
                  <ul className="mt-8 space-y-3 border-t border-ink/10 pt-6">
                    {item.outcomes.map((o, j) => (
                      <li key={j} className="flex gap-3 text-fluid-sm text-ink/85">
                        <span aria-hidden="true" className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full bg-terracotta" />
                        <span>{o}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => setOpenIndex(i)}
                    data-cursor="Open"
                    className="btn-ghost mt-8"
                  >
                    Read case study<span className="sr-only">: {item.title}</span>
                    <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                  </button>
                </div>
              </div>
            </article>
          ))}
          <div aria-hidden="true" className="hidden w-[8vw] shrink-0 md:motion-safe:block" />
        </div>

        {/* Scroll progress (desktop only) */}
        <div aria-hidden="true" className="absolute inset-x-[var(--gutter)] bottom-8 hidden h-px bg-ink/10 md:motion-safe:block">
          <div ref={progress} className="h-px origin-left bg-terracotta" style={{ transform: 'scaleX(0)' }} />
        </div>
      </div>

      {openIndex !== null && (
        <CaseStudyOverlay item={initiatives[openIndex]} index={openIndex} onClose={() => setOpenIndex(null)} />
      )}
    </section>
  )
}
