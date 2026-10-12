import { useRef, useState } from 'react'
import { useGSAP } from '../../lib/gsap'
import { revealItems } from '../../lib/animations'
import SectionHeading from '../ui/SectionHeading'
import ExpertiseIcon from '../ui/ExpertiseIcon'
import { expertise } from '../../data/content'

/**
 * What I do: large expandable rows (accordion). Opening is click / tap /
 * keyboard so rows never jump under a moving mouse; hover previews the row
 * by drawing its icon and nudging the title.
 */
export default function Expertise() {
  const root = useRef(null)
  const [open, setOpen] = useState(0)

  useGSAP(() => revealItems('[data-row]', { trigger: '[data-rows]', stagger: 0.06 }), { scope: root })

  return (
    <section id="expertise" ref={root} aria-labelledby="expertise-title" className="relative py-24 md:py-36" data-dim="1">
      <div className="container-site">
        <div className="grid gap-6 md:grid-cols-12">
          <SectionHeading
            index="05"
            eyebrow="What I do"
            title="Where I help leadership teams."
            id="expertise-title"
            className="md:col-span-7"
          />
          <p className="self-end text-fluid-base text-muted md:col-span-4 md:col-start-9">
            From a first HR roadmap to culture across four countries. Select an area to read more.
          </p>
        </div>

        <ul data-rows className="mt-16 border-t border-ink/15 md:mt-20">
          {expertise.map((item, i) => {
            const isOpen = open === i
            const panelId = `expertise-panel-${i}`
            const buttonId = `expertise-button-${i}`
            return (
              <li key={item.title} data-row className="border-b border-ink/15" data-open={isOpen}>
                <h3>
                  <button
                    id={buttonId}
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpen(isOpen ? -1 : i)}
                    data-cursor={isOpen ? 'Close' : 'Open'}
                    className="group flex min-h-[44px] w-full items-center gap-5 py-6 text-left md:gap-8 md:py-8"
                  >
                    <span className="w-8 shrink-0 text-fluid-xs tabular-nums text-muted">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <ExpertiseIcon
                      name={item.icon}
                      className={`h-8 w-8 shrink-0 transition-colors duration-300 md:h-10 md:w-10 ${isOpen ? 'text-terracotta' : 'text-ink/60 group-hover:text-terracotta'}`}
                    />
                    <span className="flex-1 font-display text-fluid-xl font-light tracking-tight transition-transform duration-500 ease-out-power3 group-hover:translate-x-2 md:text-fluid-2xl">
                      {item.title}
                    </span>
                    <span
                      aria-hidden="true"
                      className={`relative h-10 w-10 shrink-0 rounded-full border transition-colors duration-300 ${isOpen ? 'border-terracotta bg-terracotta text-paper' : 'border-ink/20 group-hover:border-ink'}`}
                    >
                      <span className="absolute left-1/2 top-1/2 h-px w-3.5 -translate-x-1/2 -translate-y-1/2 bg-current" />
                      <span
                        className={`absolute left-1/2 top-1/2 h-3.5 w-px -translate-x-1/2 -translate-y-1/2 bg-current transition-transform duration-300 ${isOpen ? 'scale-y-0' : ''}`}
                      />
                    </span>
                  </button>
                </h3>
                <div id={panelId} role="region" aria-labelledby={buttonId} aria-hidden={!isOpen} className="expand" data-open={isOpen}>
                  <div>
                    <p className="max-w-[60ch] pb-8 pl-[3.25rem] text-fluid-lg text-ink/80 md:pl-[8.5rem]">
                      {item.body}
                    </p>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
