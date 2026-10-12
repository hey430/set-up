/**
 * Lenis smooth scrolling, synced with GSAP ScrollTrigger.
 * Falls back to native scrolling when the user prefers reduced motion.
 */
import Lenis from 'lenis'
import { gsap, ScrollTrigger } from './gsap'
import { prefersReducedMotion } from './env'

let lenis = null

export function initSmoothScroll() {
  if (lenis || prefersReducedMotion()) return () => {}

  lenis = new Lenis({
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // expo.out
    smoothWheel: true,
    wheelMultiplier: 0.9,
    touchMultiplier: 1.2,
  })

  // Lenis drives ScrollTrigger, GSAP's ticker drives Lenis: one RAF loop.
  lenis.on('scroll', ScrollTrigger.update)
  const tick = (time) => lenis && lenis.raf(time * 1000)
  gsap.ticker.add(tick)
  gsap.ticker.lagSmoothing(0)

  return () => {
    gsap.ticker.remove(tick)
    lenis?.destroy()
    lenis = null
  }
}

export function getLenis() {
  return lenis
}

/** Scroll to a selector / element / y. Works with and without Lenis. */
export function scrollToTarget(target, { offset = 0, immediate = false } = {}) {
  const prefersReduced = prefersReducedMotion()
  if (lenis) {
    lenis.scrollTo(target, { offset, immediate, duration: 1.6 })
    return
  }
  const el = typeof target === 'string' ? document.querySelector(target) : target
  const top =
    typeof target === 'number'
      ? target
      : el
        ? el.getBoundingClientRect().top + window.scrollY + offset
        : 0
  window.scrollTo({ top, behavior: prefersReduced || immediate ? 'auto' : 'smooth' })
}

export function stopScroll() {
  lenis?.stop()
  document.documentElement.classList.add('scroll-locked')
}

export function startScroll() {
  lenis?.start()
  document.documentElement.classList.remove('scroll-locked')
}
