import { useEffect, useRef } from 'react'
import { gsap } from '../../lib/gsap'

/**
 * Terracotta dot + trailing ring. Grows over links and shows a label from
 * `data-cursor="View"` (or Open / Email ...). Only mounted on fine pointers.
 */
export default function Cursor() {
  const dot = useRef(null)
  const ring = useRef(null)
  const label = useRef(null)

  useEffect(() => {
    document.documentElement.classList.add('has-custom-cursor')
    const dx = gsap.quickTo(dot.current, 'x', { duration: 0.12, ease: 'power3.out' })
    const dy = gsap.quickTo(dot.current, 'y', { duration: 0.12, ease: 'power3.out' })
    const rx = gsap.quickTo(ring.current, 'x', { duration: 0.5, ease: 'power3.out' })
    const ry = gsap.quickTo(ring.current, 'y', { duration: 0.5, ease: 'power3.out' })
    gsap.set([dot.current, ring.current], { autoAlpha: 0 })

    let visible = false
    const onMove = (e) => {
      if (!visible) {
        visible = true
        gsap.set([dot.current, ring.current], { x: e.clientX, y: e.clientY })
        gsap.to([dot.current, ring.current], { autoAlpha: 1, duration: 0.3 })
      }
      dx(e.clientX)
      dy(e.clientY)
      rx(e.clientX)
      ry(e.clientY)
    }
    const onOver = (e) => {
      const el = e.target.closest('[data-cursor], a, button, [role="button"], label, summary')
      if (!el) {
        ring.current.dataset.state = ''
        gsap.to(dot.current, { scale: 1, duration: 0.2 })
        return
      }
      const text = el.getAttribute('data-cursor')
      if (text) {
        label.current.textContent = text
        ring.current.dataset.state = 'label'
        gsap.to(dot.current, { scale: 0, duration: 0.2 })
      } else {
        ring.current.dataset.state = 'link'
        gsap.to(dot.current, { scale: 1, duration: 0.2 })
      }
    }
    const onOut = (e) => {
      if (!e.relatedTarget || !e.relatedTarget.closest?.('[data-cursor], a, button, [role="button"], label, summary')) {
        ring.current.dataset.state = ''
        gsap.to(dot.current, { scale: 1, duration: 0.2 })
      }
    }
    const onLeave = () => {
      visible = false
      gsap.to([dot.current, ring.current], { autoAlpha: 0, duration: 0.3 })
    }
    const onDown = () => gsap.to(ring.current, { scale: 0.85, duration: 0.2 })
    const onUp = () => gsap.to(ring.current, { scale: 1, duration: 0.3, ease: 'power3.out' })

    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerover', onOver)
    document.addEventListener('pointerout', onOut)
    document.documentElement.addEventListener('pointerleave', onLeave)
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup', onUp)
    return () => {
      document.documentElement.classList.remove('has-custom-cursor')
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerover', onOver)
      document.removeEventListener('pointerout', onOut)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
    }
  }, [])

  return (
    <div aria-hidden="true">
      <div ref={ring} className="cursor-ring" data-state="">
        <span ref={label} className="cursor-label" />
      </div>
      <div ref={dot} className="cursor-dot" />
    </div>
  )
}
