import { useCallback, useEffect, useRef, useState } from 'react'
import { gsap, useGSAP, ScrollTrigger, EASE } from '../../lib/gsap'
import { scrollToTarget, startScroll, stopScroll } from '../../lib/scroll'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import { prefersReducedMotion } from '../../lib/env'
import { nav } from '../../data/content'
import { SITE } from '../../config/site'

/**
 * Minimal fixed header (RF monogram + menu button) and a full-screen,
 * keyboard-accessible menu overlay with staggered links.
 */
export default function Header() {
  const [open, setOpen] = useState(false)
  const headerRef = useRef(null)
  const overlayRef = useRef(null)
  const tl = useRef(null)

  const close = useCallback(() => setOpen(false), [])
  useFocusTrap(overlayRef, open, close)

  // Hide on scroll down, reveal on scroll up
  useGSAP(() => {
    if (prefersReducedMotion()) return
    const st = ScrollTrigger.create({
      start: 'top -120',
      end: 'max',
      onUpdate: (self) => {
        gsap.to(headerRef.current, {
          yPercent: self.direction === 1 ? -110 : 0,
          duration: 0.4,
          ease: EASE.out,
          overwrite: true,
        })
      },
    })
    return () => st.kill()
  })

  // Overlay timeline (built once, played / reversed)
  useGSAP(
    () => {
      const reduced = prefersReducedMotion()
      tl.current = gsap
        .timeline({ paused: true })
        .set(overlayRef.current, { autoAlpha: 1 })
        .fromTo(
          overlayRef.current,
          { clipPath: 'inset(0% 0% 100% 0%)' },
          { clipPath: 'inset(0% 0% 0% 0%)', duration: reduced ? 0.01 : 0.9, ease: EASE.inOut },
        )
        .from(
          '[data-menu-link]',
          { yPercent: 110, duration: reduced ? 0.01 : 0.8, ease: EASE.out, stagger: 0.06 },
          '-=0.35',
        )
        .from('[data-menu-meta]', { autoAlpha: 0, y: 12, duration: 0.5, ease: EASE.out, stagger: 0.05 }, '-=0.5')
    },
    { scope: overlayRef },
  )

  useEffect(() => {
    if (!tl.current) return
    if (open) {
      stopScroll()
      gsap.set(headerRef.current, { yPercent: 0 })
      tl.current.timeScale(1).play()
    } else {
      startScroll()
      tl.current.timeScale(1.6).reverse()
    }
  }, [open])

  const go = (id) => (e) => {
    e.preventDefault()
    setOpen(false)
    // Wait for the overlay to start closing before scrolling
    setTimeout(() => scrollToTarget(`#${id}`), open ? 350 : 0)
  }

  return (
    <>
      <a
        href="#main"
        className="btn-primary fixed left-4 top-4 z-[95] -translate-y-24 focus:translate-y-0"
      >
        Skip to content
      </a>

      <header
        ref={headerRef}
        className="fixed inset-x-0 top-0 z-[80] text-paper mix-blend-difference"
      >
        <div className="container-site flex h-20 items-center justify-between">
          <a
            href="#top"
            onClick={go('top')}
            className="inline-flex min-h-[44px] items-center font-display text-2xl tracking-tight"
            aria-label={`RF, ${SITE.name}, back to top`}
          >
            RF
          </a>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="site-menu"
            className="group inline-flex min-h-[44px] items-center gap-3 text-fluid-sm font-medium uppercase tracking-[0.16em]"
          >
            <span>{open ? 'Close' : 'Menu'}</span>
            <span aria-hidden="true" className="relative block h-3 w-7">
              <span
                className={`absolute left-0 top-0 h-px w-full bg-current transition-transform duration-300 ${open ? 'translate-y-[6px] rotate-45' : ''}`}
              />
              <span
                className={`absolute bottom-0 left-0 h-px w-full bg-current transition-transform duration-300 ${open ? '-translate-y-[5px] -rotate-45' : 'origin-right group-hover:scale-x-75'}`}
              />
            </span>
          </button>
        </div>
      </header>

      <div
        id="site-menu"
        ref={overlayRef}
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        className="on-dark invisible fixed inset-0 z-[70] flex flex-col bg-ink text-paper"
        style={{ clipPath: 'inset(0% 0% 100% 0%)' }}
      >
        <div className="container-site flex flex-1 flex-col justify-center pt-24">
          <nav aria-label="Primary">
            <ul className="space-y-1 md:space-y-2">
              {nav.map((item, i) => (
                <li key={item.id} className="overflow-hidden">
                  <a
                    data-menu-link
                    href={`#${item.id}`}
                    onClick={go(item.id)}
                    tabIndex={open ? 0 : -1}
                    className="group flex min-h-[44px] items-baseline gap-4 font-display text-[clamp(2.25rem,7vw,5.5rem)] font-light leading-[1.05] tracking-tightest"
                  >
                    <span className="font-sans text-fluid-xs tabular-nums text-stone-deep">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="transition-[color,transform] duration-300 group-hover:translate-x-3 group-hover:text-terracotta group-focus-visible:text-terracotta">
                      {item.label}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="container-site flex flex-col gap-3 pb-10 text-fluid-sm text-stone md:flex-row md:items-center md:justify-between">
          <a data-menu-meta tabIndex={open ? 0 : -1} href={`mailto:${SITE.email}`} className="link-underline inline-flex min-h-[44px] items-center">
            {SITE.email}
          </a>
          <a
            data-menu-meta
            tabIndex={open ? 0 : -1}
            href={SITE.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="link-underline inline-flex min-h-[44px] items-center"
          >
            LinkedIn ↗
          </a>
          <p data-menu-meta>{SITE.location}</p>
        </div>
      </div>
    </>
  )
}
