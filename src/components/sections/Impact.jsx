import { useRef } from 'react'
import { gsap, useGSAP, ScrollTrigger } from '../../lib/gsap'
import { revealItems } from '../../lib/animations'
import { prefersReducedMotion } from '../../lib/env'
import SectionHeading from '../ui/SectionHeading'
import { impact } from '../../data/content'

/**
 * Impact in numbers. Large terracotta count-ups, triggered once in view.
 * Behind it, the network rises into the "thriving curve".
 */
export default function Impact() {
  const root = useRef(null)

  useGSAP(
    () => {
      revealItems('[data-stat]', { trigger: '[data-stats]', stagger: 0.08 })
      if (prefersReducedMotion()) return
      root.current.querySelectorAll('[data-count]').forEach((el) => {
        const end = Number(el.dataset.count)
        const obj = { v: 0 }
        el.textContent = '0'
        ScrollTrigger.create({
          trigger: el,
          start: 'top 88%',
          once: true,
          onEnter: () =>
            gsap.to(obj, {
              v: end,
              duration: end > 50 ? 2.2 : 1.4,
              ease: 'power3.out',
              onUpdate: () => {
                el.textContent = Math.round(obj.v).toString()
              },
            }),
        })
      })
    },
    { scope: root },
  )

  return (
    <section id="impact" ref={root} aria-labelledby="impact-title" className="relative py-24 md:py-36">
      <div className="container-site">
        <div className="grid gap-8 md:grid-cols-12">
          <SectionHeading
            index="02"
            eyebrow="Impact in numbers"
            title="Measurable change, built around people."
            id="impact-title"
            className="md:col-span-7"
          />
          <p className="self-end text-fluid-base text-muted md:col-span-4 md:col-start-9">
            Culture can feel intangible. These are the outcomes leadership teams could actually see.
          </p>
        </div>

        <ul data-stats className="mt-16 grid grid-cols-1 border-t border-ink/15 sm:grid-cols-2 xl:grid-cols-4 md:mt-24">
          {impact.map((s, i) => (
            <li
              key={i}
              data-stat
              className={`flex flex-col justify-between gap-6 border-b border-ink/15 py-8 sm:px-6 sm:[&:nth-child(odd)]:pl-0 xl:[&:nth-child(4n+1)]:pl-0 ${
                i === impact.length - 1 ? 'sm:col-span-2 xl:col-span-1' : ''
              } bg-paper/40 backdrop-blur-[2px]`}
            >
              <p className="font-display text-fluid-4xl font-light leading-none tracking-tightest text-terracotta">
                <span className="sr-only">
                  {s.value}
                  {s.suffix}
                </span>
                <span aria-hidden="true">
                  <span data-count={s.value} className="tabular-nums">
                    {s.value}
                  </span>
                  {s.suffix}
                </span>
              </p>
              <p className="max-w-[26ch] text-fluid-sm text-ink/80">{s.label}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
