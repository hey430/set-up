import { useEffect, useRef } from 'react'
import { gsap, useGSAP, ScrollTrigger } from '../../lib/gsap'
import { revealItems } from '../../lib/animations'
import { hasFinePointer, prefersReducedMotion } from '../../lib/env'
import SectionHeading from '../ui/SectionHeading'
import { research } from '../../data/content'

/** Moderation diagram: Friendship → Thriving, with Conflict as moderator. */
function ModelDiagram() {
  return (
    <svg
      viewBox="0 0 600 330"
      role="img"
      aria-labelledby="diagram-title diagram-desc"
      className="h-auto w-full"
      data-diagram
    >
      <title id="diagram-title">Research model</title>
      <desc id="diagram-desc">
        Workplace friendship leads to thriving at work (significant positive effect). Interpersonal conflict was tested
        as a moderator of that link and did not significantly weaken it.
      </desc>
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
          <path d="M0 0 10 5 0 10z" fill="#F6F2EC" />
        </marker>
        <marker id="arrow-soft" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
          <path d="M0 0 10 5 0 10z" fill="#A9C4C0" />
        </marker>
      </defs>

      {/* Moderator */}
      <g data-node>
        <rect x="190" y="14" width="220" height="74" rx="37" fill="none" stroke="#A9C4C0" strokeWidth="1.5" />
        <text x="300" y="46" textAnchor="middle" fill="#F6F2EC" fontFamily="Inter, sans-serif" fontSize="19">
          Interpersonal
        </text>
        <text x="300" y="70" textAnchor="middle" fill="#F6F2EC" fontFamily="Inter, sans-serif" fontSize="19">
          conflict
        </text>
      </g>
      <path
        data-draw
        d="M300 90 L300 226"
        pathLength="1"
        stroke="#A9C4C0"
        strokeWidth="1.5"
        strokeDasharray="1"
        fill="none"
        markerEnd="url(#arrow-soft)"
      />
      <text data-node x="312" y="168" fill="#A9C4C0" fontFamily="Inter, sans-serif" fontSize="16" fontStyle="italic">
        moderator · n.s.
      </text>

      {/* Main path */}
      <g data-node>
        <rect x="6" y="194" width="196" height="96" rx="20" fill="#F6F2EC" />
        <text x="104" y="236" textAnchor="middle" fill="#1F4E4F" fontFamily="Inter, sans-serif" fontSize="19" fontWeight="500">
          Workplace
        </text>
        <text x="104" y="262" textAnchor="middle" fill="#1F4E4F" fontFamily="Inter, sans-serif" fontSize="19" fontWeight="500">
          friendship
        </text>
      </g>
      <path
        data-draw
        d="M206 242 L390 242"
        pathLength="1"
        stroke="#F6F2EC"
        strokeWidth="2"
        strokeDasharray="1"
        fill="none"
        markerEnd="url(#arrow)"
      />
      <text data-node x="226" y="276" fill="#F6F2EC" fontFamily="Inter, sans-serif" fontSize="16">
        + significant
      </text>
      <g data-node>
        <rect x="398" y="194" width="196" height="96" rx="20" fill="#C8473A" />
        <text x="496" y="236" textAnchor="middle" fill="#FFFFFF" fontFamily="Inter, sans-serif" fontSize="19" fontWeight="500">
          Thriving
        </text>
        <text x="496" y="262" textAnchor="middle" fill="#FFFFFF" fontFamily="Inter, sans-serif" fontSize="19" fontWeight="500">
          at work
        </text>
      </g>
    </svg>
  )
}

/**
 * Research: Master's thesis highlight card with a subtle 3D "paper" tilt,
 * an animated model diagram, and other research projects. Deep teal section.
 */
export default function Research() {
  const root = useRef(null)
  const card = useRef(null)

  useGSAP(
    () => {
      // Tell the WebGL layer to pause while this opaque section fills the screen
      ScrollTrigger.create({
        trigger: root.current,
        start: 'top top',
        end: 'bottom bottom',
        onToggle: (self) => window.dispatchEvent(new CustomEvent('network:cover', { detail: self.isActive })),
      })

      revealItems('[data-research-card]', { y: 50 })
      revealItems('[data-other]', { trigger: '[data-others]', stagger: 0.05, y: 16 })
      if (prefersReducedMotion()) return
      gsap
        .timeline({ scrollTrigger: { trigger: '[data-diagram]', start: 'top 80%', once: true } })
        .from('[data-diagram] [data-node]', { autoAlpha: 0, y: 10, duration: 0.8, ease: 'power3.out', stagger: 0.15 })
        .fromTo(
          '[data-diagram] [data-draw]',
          { strokeDashoffset: 1 },
          { strokeDashoffset: 0, duration: 1.2, ease: 'expo.inOut', stagger: 0.25 },
          0.2,
        )
    },
    { scope: root },
  )

  // Paper tilt on hover (fine pointers only)
  useEffect(() => {
    const el = card.current
    if (!el || !hasFinePointer() || prefersReducedMotion()) return
    const rx = gsap.quickTo(el, 'rotationX', { duration: 0.8, ease: 'power3.out' })
    const ry = gsap.quickTo(el, 'rotationY', { duration: 0.8, ease: 'power3.out' })
    const onMove = (e) => {
      const r = el.getBoundingClientRect()
      const px = (e.clientX - r.left) / r.width - 0.5
      const py = (e.clientY - r.top) / r.height - 0.5
      ry(px * 7)
      rx(-py * 6)
      el.style.setProperty('--shine-x', `${(px + 0.5) * 100}%`)
      el.style.setProperty('--shine-y', `${(py + 0.5) * 100}%`)
    }
    const onLeave = () => {
      rx(0)
      ry(0)
    }
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerleave', onLeave)
    return () => {
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  return (
    <section
      id="research"
      ref={root}
      aria-labelledby="research-title"
      className="on-dark relative z-[1] bg-teal py-24 text-paper md:py-36"
    >
      <div className="container-site">
        <SectionHeading
          index="06"
          eyebrow="Research"
          title="Why friendships at work matter."
          id="research-title"
          light
        />

        <div className="mt-16 grid gap-12 md:mt-20 xl:grid-cols-12 xl:gap-10">
          {/* Thesis card */}
          <div className="[perspective:1200px] xl:col-span-7">
            <article
              ref={card}
              data-research-card
              className="relative overflow-hidden rounded-[1.5rem] rounded-tr-none bg-paper p-8 text-ink shadow-[0_40px_80px_-30px_rgba(0,0,0,0.45)] [transform-style:preserve-3d] md:p-12"
              style={{
                backgroundImage:
                  'radial-gradient(circle at var(--shine-x, 30%) var(--shine-y, 20%), rgba(255,255,255,0.75), transparent 45%)',
              }}
            >
              {/* folded corner */}
              <span
                aria-hidden="true"
                className="absolute right-0 top-0 h-14 w-14 bg-[linear-gradient(225deg,#1F4E4F_50%,#E6DED3_50%)]"
              />
              <p className="eyebrow">{research.meta}</p>
              <h3 className="mt-6 font-display text-fluid-2xl font-normal leading-tight tracking-tight">
                {research.title}
              </h3>
              <p className="mt-3 text-fluid-sm text-muted">{research.supervisor}</p>

              <div className="mt-8 flex flex-wrap gap-8 border-y border-ink/10 py-6">
                {research.stats.map((s) => (
                  <div key={s.label}>
                    <p className="font-display text-fluid-3xl font-light leading-none text-terracotta">{s.value}</p>
                    <p className="mt-2 text-fluid-xs uppercase tracking-[0.14em] text-muted">{s.label}</p>
                  </div>
                ))}
              </div>

              <h4 className="mt-8 text-fluid-xs font-medium uppercase tracking-[0.16em] text-terracotta-deep">
                Key finding, in plain language
              </h4>
              <p className="mt-3 text-fluid-lg text-ink/85">{research.finding}</p>
            </article>
          </div>

          {/* Diagram + other projects */}
          <div className="flex flex-col gap-14 xl:col-span-5">
            <div>
              <p className="mb-6 text-fluid-xs uppercase tracking-[0.16em] text-teal-soft">The model I tested</p>
              <ModelDiagram />
            </div>

            <div>
              <h3 className="font-sans text-fluid-xs font-medium uppercase tracking-[0.16em] text-teal-soft">Other research</h3>
              <ul data-others className="mt-4 divide-y divide-paper/15 border-y border-paper/15">
                {research.others.map((r) => (
                  <li key={r} data-other className="flex gap-4 py-3.5 text-fluid-sm text-paper/90">
                    <span aria-hidden="true" className="text-terracotta">◦</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
