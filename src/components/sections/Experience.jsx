import { useRef } from 'react'
import { gsap, useGSAP } from '../../lib/gsap'
import { revealItems } from '../../lib/animations'
import { prefersReducedMotion } from '../../lib/env'
import SectionHeading from '../ui/SectionHeading'
import { experience, rolesHired } from '../../data/content'

/**
 * Experience timeline: a thin terracotta line draws itself as you scroll and
 * each role slides in. Behind it, the network becomes a globe with hubs in
 * Pakistan, Canada, the USA and Indonesia.
 */
export default function Experience() {
  const root = useRef(null)

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      gsap.from('[data-timeline-line]', {
        scaleY: 0,
        transformOrigin: '50% 0%',
        ease: 'none',
        scrollTrigger: { trigger: '[data-timeline]', start: 'top 70%', end: 'bottom 60%', scrub: 0.6 },
      })
      gsap.utils.toArray('[data-role]').forEach((el) => {
        gsap
          .timeline({ scrollTrigger: { trigger: el, start: 'top 78%', once: true } })
          .from(el.querySelector('[data-dot]'), { scale: 0, duration: 0.5, ease: 'back.out(2)' })
          .from(el.querySelectorAll('[data-role-item]'), { x: 30, autoAlpha: 0, duration: 0.9, ease: 'power3.out', stagger: 0.06 }, '-=0.3')
      })
      revealItems('[data-marquee]', { trigger: '[data-marquee]' })
    },
    { scope: root },
  )

  return (
    <section id="experience" ref={root} aria-labelledby="experience-title" className="relative py-24 md:py-36">
      <div className="container-site">
        <div className="grid gap-6 md:grid-cols-12">
          <SectionHeading
            index="04"
            eyebrow="Experience"
            title="Six years, four countries, one thread: people."
            id="experience-title"
            className="md:col-span-7"
          />
        </div>

        <ol data-timeline className="relative mt-16 md:mt-24 md:w-[58%]">
          <span data-timeline-line aria-hidden="true" className="absolute bottom-0 left-[5px] top-2 w-px bg-terracotta" />
          {experience.map((job, i) => (
            <li key={i} data-role className="relative pb-14 pl-10 last:pb-0 md:pl-14">
              <span
                data-dot
                aria-hidden="true"
                className={`absolute left-0 top-2 h-[11px] w-[11px] rounded-full border-2 border-terracotta ${i === 0 ? 'bg-terracotta' : 'bg-paper'}`}
              />
              <p data-role-item className="text-fluid-xs uppercase tracking-[0.16em] text-muted">
                <time>{job.period}</time>
                {i === 0 && <span className="ml-3 rounded-full bg-terracotta-deep px-2 py-0.5 text-paper">Now</span>}
              </p>
              <h3 data-role-item className="mt-2 font-display text-fluid-2xl font-normal tracking-tight">
                {job.role}
              </h3>
              <p data-role-item className="mt-1 text-fluid-base font-medium text-ink/85">
                {job.company}
                {job.location && <span className="font-normal text-muted"> · {job.location}</span>}
              </p>
              <p data-role-item className="mt-3 max-w-[52ch] text-fluid-sm text-ink/75">
                {job.detail}
              </p>
            </li>
          ))}
        </ol>
      </div>

      {/* Roles hired for: slow infinite marquee */}
      <div data-marquee className="mt-24 md:mt-32">
        <div className="container-site">
          <h3 className="eyebrow">Roles I have hired for</h3>
        </div>
        <div className="marquee relative mt-6 overflow-hidden border-y border-ink/10 bg-paper/60 py-6 backdrop-blur-[2px]">
          <ul className="sr-only">
            {rolesHired.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          <div aria-hidden="true" className="marquee-track flex w-max">
            {[0, 1].map((copy) => (
              <div key={copy} className="flex shrink-0 items-center">
                {rolesHired.map((r) => (
                  <span key={r} className="flex items-center whitespace-nowrap font-display text-fluid-2xl font-light italic">
                    <span className="px-6 md:px-10">{r}</span>
                    <span className="h-2 w-2 rounded-full bg-terracotta" />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
