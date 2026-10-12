import { useEffect, useRef } from 'react'
import { gsap } from '../../lib/gsap'
import { hasFinePointer, prefersReducedMotion } from '../../lib/env'

/**
 * Wraps a single interactive child and pulls it gently toward the pointer.
 * The inner content moves a little further for depth.
 */
export default function Magnetic({ children, strength = 0.35, className = '' }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el || !hasFinePointer() || prefersReducedMotion()) return
    const inner = el.firstElementChild
    const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3.out' })
    const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3.out' })
    const ixTo = inner ? gsap.quickTo(inner, 'x', { duration: 0.6, ease: 'power3.out' }) : null
    const iyTo = inner ? gsap.quickTo(inner, 'y', { duration: 0.6, ease: 'power3.out' }) : null

    const onMove = (e) => {
      const r = el.getBoundingClientRect()
      const x = e.clientX - (r.left + r.width / 2)
      const y = e.clientY - (r.top + r.height / 2)
      xTo(x * strength)
      yTo(y * strength)
      ixTo?.(x * strength * 0.25)
      iyTo?.(y * strength * 0.25)
    }
    const onLeave = () => {
      xTo(0)
      yTo(0)
      ixTo?.(0)
      iyTo?.(0)
    }
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerleave', onLeave)
    return () => {
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
    }
  }, [strength])

  return (
    <div ref={ref} className={`inline-block will-change-transform ${className}`}>
      {children}
    </div>
  )
}
