import { useCallback, useEffect, useRef, useState } from 'react'
import { gsap } from '../../lib/gsap'
import { prefersReducedMotion } from '../../lib/env'
import SectionHeading from '../ui/SectionHeading'
import { testimonials } from '../../data/content'
import { FLAGS } from '../../config/site'

const INTERVAL = 7000

/**
 * Fading quote slider. Hidden by default (FLAGS.SHOW_TESTIMONIALS) until real,
 * approved testimonials replace the placeholders in src/data/content.js.
 */
export default function Testimonials() {
  if (!FLAGS.SHOW_TESTIMONIALS || !testimonials.length) return null
  return <TestimonialSlider />
}

function TestimonialSlider() {
  const root = useRef(null)
  const quoteRef = useRef(null)
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const count = testimonials.length

  const go = useCallback(
    (dir) => {
      const next = (index + dir + count) % count
      if (prefersReducedMotion()) {
        setIndex(next)
        return
      }
      gsap.to(quoteRef.current, {
        autoAlpha: 0,
        y: -10,
        duration: 0.35,
        ease: 'power2.in',
        onComplete: () => {
          setIndex(next)
          gsap.fromTo(quoteRef.current, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out' })
        },
      })
    },
    [index, count],
  )

  useEffect(() => {
    if (paused || prefersReducedMotion() || count < 2) return
    const id = setTimeout(() => go(1), INTERVAL)
    return () => clearTimeout(id)
  }, [index, paused, go, count])


  const t = testimonials[index]

  return (
    <section
      id="testimonials"
      ref={root}
      aria-labelledby="testimonials-title"
      aria-roledescription="carousel"
      className="relative py-24 md:py-36"
      data-dim="1"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="container-site">
        <SectionHeading index="08" eyebrow="Kind words" title="What colleagues say." id="testimonials-title" />
        <figure ref={quoteRef} className="mt-14 max-w-[52rem]" aria-live="polite">
          <blockquote className="font-display text-fluid-3xl font-light leading-tight tracking-tight">
            <span aria-hidden="true" className="text-terracotta">“</span>
            {t.quote}
            <span aria-hidden="true" className="text-terracotta">”</span>
          </blockquote>
          <figcaption className="mt-8 text-fluid-base">
            <span className="font-medium">{t.name}</span>
            <span className="text-muted"> · {t.title}</span>
          </figcaption>
        </figure>
        <div className="mt-12 flex items-center gap-4">
          <button type="button" onClick={() => go(-1)} className="btn-ghost h-11 w-11 !px-0" aria-label="Previous testimonial">
            ←
          </button>
          <button type="button" onClick={() => go(1)} className="btn-ghost h-11 w-11 !px-0" aria-label="Next testimonial">
            →
          </button>
          <p className="text-fluid-xs tabular-nums text-muted" aria-hidden="true">
            {String(index + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}
          </p>
        </div>
      </div>
    </section>
  )
}
