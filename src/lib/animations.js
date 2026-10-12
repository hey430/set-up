/**
 * Reusable scroll reveal helpers. Called inside useGSAP() so everything is
 * reverted automatically on unmount. Elements are visible by default in CSS:
 * if JS or motion is off, content simply shows.
 */
import { gsap, ScrollTrigger, SplitText, EASE, DUR, STAGGER } from './gsap'
import { prefersReducedMotion } from './env'

/** Fade + rise a group of elements with a stagger when the trigger enters. */
export function revealItems(targets, { trigger, start = 'top 82%', y = 32, stagger = STAGGER, delay = 0 } = {}) {
  if (prefersReducedMotion()) return null
  const els = gsap.utils.toArray(targets)
  if (!els.length) return null
  return gsap.from(els, {
    y,
    autoAlpha: 0,
    duration: DUR.reveal,
    ease: EASE.out,
    stagger,
    delay,
    scrollTrigger: { trigger: trigger || els[0], start, once: true },
  })
}

/**
 * Line-by-line text reveal using SplitText with masked lines. autoSplit
 * re-splits on resize / font load and re-creates the animation.
 */
export function revealLines(targets, { trigger, start = 'top 85%', stagger = 0.08 } = {}) {
  if (prefersReducedMotion()) return []
  return gsap.utils.toArray(targets).map((el) =>
    SplitText.create(el, {
      type: 'lines',
      mask: 'lines',
      aria: 'none', // whole words stay intact, so screen readers read lines normally
      linesClass: 'split-line',
      autoSplit: true,
      onSplit(self) {
        return gsap.from(self.lines, {
          yPercent: 110,
          duration: DUR.reveal,
          ease: EASE.out,
          stagger,
          scrollTrigger: { trigger: trigger || el, start, once: true },
        })
      },
    }),
  )
}

/** Recalculate trigger positions after layout-changing events. */
export function refreshScroll() {
  ScrollTrigger.refresh()
}
