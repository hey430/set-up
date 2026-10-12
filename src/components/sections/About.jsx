import { useRef } from 'react'
import { gsap, useGSAP } from '../../lib/gsap'
import { revealItems, revealLines } from '../../lib/animations'
import { prefersReducedMotion } from '../../lib/env'
import SectionHeading from '../ui/SectionHeading'
import RipplePortrait from '../ui/RipplePortrait'
import { about } from '../../data/content'

/** About: cut-out portrait (ripple on hover) + first-person bio. */
export default function About() {
  const root = useRef(null)

  useGSAP(
    () => {
      revealLines('[data-bio]', { stagger: 0.06 })
      revealItems('[data-fact]', { trigger: '[data-facts]', stagger: 0.08 })
      if (prefersReducedMotion()) return
      // Portrait rises out of its arch
      gsap.from('[data-portrait]', {
        yPercent: 12,
        autoAlpha: 0,
        duration: 1.4,
        ease: 'power3.out',
        scrollTrigger: { trigger: '[data-portrait-wrap]', start: 'top 80%', once: true },
      })
      gsap.from('[data-arch]', {
        scaleY: 0,
        transformOrigin: '50% 100%',
        duration: 1.4,
        ease: 'expo.inOut',
        scrollTrigger: { trigger: '[data-portrait-wrap]', start: 'top 85%', once: true },
      })
    },
    { scope: root },
  )

  return (
    <section id="about" ref={root} aria-labelledby="about-title" className="relative py-24 md:py-36" data-dim="0.35">
      <div className="container-site grid gap-14 md:grid-cols-12 md:gap-8">
        <div data-portrait-wrap className="relative mx-auto w-full max-w-[30rem] self-start md:sticky md:top-24 md:col-span-5 md:mx-0 md:max-w-none">
          <div className="relative">
            <div
              data-arch
              aria-hidden="true"
              className="absolute inset-x-[7%] bottom-0 top-[14%] rounded-t-full bg-paper-deep ring-1 ring-stone"
            />
            <div data-portrait className="portrait-mask relative">
              <RipplePortrait alt={about.portraitAlt} />
            </div>
          </div>
          <p className="relative mt-4 text-center text-fluid-xs uppercase tracking-[0.18em] text-muted md:text-left">
            Rameesha Fatima · Karachi
          </p>
        </div>

        <div className="md:col-span-6 md:col-start-7 md:pt-10">
          <SectionHeading index="01" eyebrow="About" title={about.heading} id="about-title" />

          <div className="mt-10 space-y-5 text-fluid-lg text-ink/85">
            {about.bio.map((p, i) => (
              <p key={i} data-bio>
                {p}
              </p>
            ))}
          </div>

          <dl data-facts className="mt-12 grid grid-cols-1 gap-x-8 gap-y-6 border-t border-ink/15 pt-8 sm:grid-cols-2">
            {about.facts.map((f) => (
              <div key={f.label} data-fact>
                <dt className="text-fluid-xs uppercase tracking-[0.16em] text-muted">{f.label}</dt>
                <dd className="mt-1 font-display text-fluid-lg">{f.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}
