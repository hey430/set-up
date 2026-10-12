import { useRef } from 'react'
import { useGSAP } from '../../lib/gsap'
import { revealItems, revealLines } from '../../lib/animations'
import Magnetic from '../ui/Magnetic'
import ContactForm from './ContactForm'
import { FLAGS, SITE } from '../../config/site'

/** Contact / CTA. The network settles into a calm ring behind the headline. */
export default function Contact() {
  const root = useRef(null)

  useGSAP(
    () => {
      revealLines('[data-cta-title]', { stagger: 0.1 })
      revealItems('[data-cta-item]', { trigger: '[data-cta-body]', stagger: 0.08 })
    },
    { scope: root },
  )

  return (
    <section id="contact" ref={root} aria-labelledby="contact-title" className="relative py-24 md:py-40">
      <div className="container-site">
        <div className="flex min-h-[70svh] flex-col items-center justify-center text-center">
          <p className="eyebrow">
            <span className="tabular-nums">{FLAGS.SHOW_TESTIMONIALS ? '09' : '08'}</span>
            <span aria-hidden="true">/</span>
            <span>Contact</span>
          </p>
          <h2
            id="contact-title"
            data-cta-title
            className="mt-8 max-w-[14ch] font-display text-fluid-4xl font-light leading-[0.98] tracking-tightest md:text-[clamp(3rem,7vw,7.5rem)]"
          >
            Let’s build a workplace people <em className="text-terracotta">thrive</em> in.
          </h2>

          <div className="mt-12">
            <Magnetic strength={0.4}>
              <a
                href={`mailto:${SITE.email}`}
                data-cursor="Email"
                className="group inline-flex min-h-[64px] items-center gap-4 rounded-full bg-ink px-8 py-4 text-fluid-base text-paper transition-colors duration-300 hover:bg-terracotta-deep md:px-10 md:text-fluid-lg"
              >
                <span>{SITE.email}</span>
                <span aria-hidden="true" className="inline-block transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
              </a>
            </Magnetic>
          </div>
        </div>

        <div data-cta-body data-dim="0.85" className="mt-20 grid gap-14 border-t border-ink/15 pt-14 md:grid-cols-12">
          <div className="space-y-8 md:col-span-4">
            <div data-cta-item>
              <h3 className="eyebrow">Elsewhere</h3>
              <a
                href={SITE.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="View"
                className="link-underline mt-3 inline-flex min-h-[44px] items-center text-fluid-lg"
              >
                {SITE.linkedinLabel} <span aria-hidden="true">&nbsp;↗</span>
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </div>
            <div data-cta-item>
              <h3 className="eyebrow">Location</h3>
              <p className="mt-3 text-fluid-lg">{SITE.location}</p>
              <p className="mt-1 text-fluid-sm text-muted">{SITE.availability}</p>
            </div>
            <div data-cta-item>
              <h3 className="eyebrow">Good fit</h3>
              <p className="mt-3 text-fluid-sm text-ink/80">
                HR consulting for startups and growing international companies, and senior People &amp; Culture roles.
              </p>
            </div>
          </div>

          <div data-cta-item className="relative md:col-span-7 md:col-start-6">
            <h3 className="mb-6 font-display text-fluid-2xl font-light">Send a message</h3>
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  )
}
