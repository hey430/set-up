import { useRef } from 'react'
import { gsap, useGSAP, SplitText, EASE } from '../../lib/gsap'
import { prefersReducedMotion } from '../../lib/env'
import { scrollToTarget } from '../../lib/scroll'
import Magnetic from '../ui/Magnetic'
import { hero } from '../../data/content'
import { SITE } from '../../config/site'

/**
 * Full-screen hero. The WebGL network floats behind; the name reveals
 * character by character once the preloader has lifted (`ready`).
 */
export default function Hero({ ready }) {
  const root = useRef(null)
  const split = useRef(null)

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      // Hide immediately so nothing flashes before the reveal
      // The preloader covers the hero, so hide the name with opacity until
      // fonts are ready, then split into characters (accurate metrics).
      gsap.set('[data-hero-name]', { autoAlpha: 0 })
      document.fonts.ready.then(() => {
        if (!root.current) return
        split.current = SplitText.create('[data-hero-name]', { type: 'chars,words', mask: 'words' })
        gsap.set(split.current.chars, { yPercent: 110 })
        gsap.set('[data-hero-name]', { autoAlpha: 1 })
      })
      gsap.set('[data-hero-fade]', { autoAlpha: 0, y: 24 })
      gsap.set('[data-hero-line]', { scaleX: 0 })
      return () => split.current?.revert()
    },
    { scope: root },
  )

  useGSAP(
    () => {
      if (!ready || prefersReducedMotion()) return
      const chars = split.current ? split.current.chars : []
      gsap.set('[data-hero-name]', { autoAlpha: 1 })
      const tl = gsap.timeline({ delay: 0.1 })
      tl.to(chars, {
        yPercent: 0,
        duration: 1.2,
        ease: EASE.out,
        stagger: 0.04,
      })
        .to('[data-hero-line]', { scaleX: 1, duration: 1.2, ease: EASE.inOut }, '-=0.9')
        .to('[data-hero-fade]', { autoAlpha: 1, y: 0, duration: 1, ease: EASE.out, stagger: 0.08 }, '-=0.9')

      // Gentle parallax: the name drifts up slower than the page
      gsap.to('[data-hero-name]', {
        yPercent: -18,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true },
      })
    },
    { dependencies: [ready], scope: root },
  )

  return (
    <section
      id="top"
      ref={root}
      aria-labelledby="hero-title"
      className="relative flex min-h-[100svh] flex-col justify-end pb-10 pt-28 md:pb-14"
    >
      <div className="container-site">
        <p data-hero-fade className="eyebrow mb-6 md:mb-10">
          {hero.eyebrow}
        </p>

        <h1
          id="hero-title"
          data-hero-name
          className="font-display text-[17vw] font-light leading-[0.9] tracking-tightest md:text-fluid-hero"
          style={{ fontVariationSettings: '"SOFT" 100, "WONK" 1' }}
        >
          <span className="block">Rameesha</span>
          <span className="block pl-[8vw] italic md:pl-[14vw]">
            Fatima<span className="not-italic text-terracotta">.</span>
          </span>
        </h1>

        <div data-hero-line className="mt-8 h-px w-full origin-left bg-ink/20 md:mt-12" />

        <div className="mt-6 grid gap-8 md:mt-8 md:grid-cols-12 md:items-end">
          <p data-hero-fade className="font-display text-fluid-2xl font-light leading-tight md:col-span-6">
            {hero.tagline}
          </p>
          <div data-hero-fade className="flex flex-wrap items-center gap-3 md:col-span-6 md:justify-end">
            <Magnetic>
              <a
                href="#contact"
                className="btn-primary"
                data-cursor="Hello"
                onClick={(e) => {
                  e.preventDefault()
                  scrollToTarget('#contact')
                }}
              >
                Work with me
              </a>
            </Magnetic>
            <Magnetic>
              <a
                href="#experience"
                className="btn-ghost"
                data-cursor="View"
                onClick={(e) => {
                  e.preventDefault()
                  scrollToTarget('#experience')
                }}
              >
                View experience
              </a>
            </Magnetic>
          </div>
        </div>

        <div className="mt-12 flex items-end justify-between text-fluid-xs text-muted md:mt-16">
          <p data-hero-fade>{hero.location}</p>
          <a
            data-hero-fade
            href="#about"
            onClick={(e) => {
              e.preventDefault()
              scrollToTarget('#about')
            }}
            className="group flex min-h-[44px] flex-col items-center gap-2 uppercase tracking-[0.18em]"
            aria-label="Scroll to About"
          >
            <span>Scroll</span>
            <span aria-hidden="true" className="relative block h-10 w-px overflow-hidden bg-ink/15">
              <span className="absolute inset-x-0 top-0 h-1/2 animate-[scrollcue_2.2s_cubic-bezier(0.87,0,0.13,1)_infinite] bg-terracotta" />
            </span>
          </a>
          <p data-hero-fade className="hidden md:block">{SITE.role}</p>
        </div>
      </div>
    </section>
  )
}
