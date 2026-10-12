import { useRef } from 'react'
import { useGSAP } from '../../lib/gsap'
import { revealItems } from '../../lib/animations'
import SectionHeading from '../ui/SectionHeading'
import { recognition } from '../../data/content'

function Group({ title, items, className = '' }) {
  return (
    <div data-group className={className}>
      <h3 className="eyebrow">{title}</h3>
      <ul className="mt-5 grid gap-3">
        {items.map((item) => (
          <li
            key={`${item.title}-${item.place}`}
            data-card
            className="group rounded-2xl border border-stone bg-[#FBF8F4]/90 p-6 transition-[border-color,transform] duration-500 ease-out-power3 hover:-translate-y-1 hover:border-terracotta/50"
          >
            <div className="flex items-start justify-between gap-4">
              <p className="font-display text-fluid-lg font-normal leading-snug">{item.title}</p>
              {item.year && <p className="shrink-0 text-fluid-xs tabular-nums text-terracotta-deep">{item.year}</p>}
            </div>
            <p className="mt-1 text-fluid-sm text-muted">{item.place}</p>
            {item.note && <p className="mt-3 text-fluid-sm text-ink/75">{item.note}</p>}
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Education, awards, community work and leadership training. */
export default function Recognition() {
  const root = useRef(null)

  useGSAP(
    () => {
      root.current.querySelectorAll('[data-group]').forEach((group) => {
        revealItems(group.querySelectorAll('[data-card]'), { trigger: group, stagger: 0.08 })
      })
    },
    { scope: root },
  )

  return (
    <section id="recognition" ref={root} aria-labelledby="recognition-title" className="relative py-24 md:py-36" data-dim="1">
      <div className="container-site">
        <SectionHeading
          index="07"
          eyebrow="Education, recognition & community"
          title="Learning, giving back, and being recognised for it."
          id="recognition-title"
          titleClassName="max-w-[22ch]"
        />

        <div className="mt-16 grid gap-12 md:mt-20 md:grid-cols-2 xl:grid-cols-4 xl:gap-8">
          <Group title="Education" items={recognition.education} />
          <Group title="Awards" items={recognition.awards} />
          <Group title="Community" items={recognition.community} />
          <Group title="Leadership training" items={recognition.training} />
        </div>
      </div>
    </section>
  )
}
