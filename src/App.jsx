import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { ScrollTrigger, useGSAP } from './lib/gsap'
import { initSmoothScroll, startScroll, stopScroll } from './lib/scroll'
import { sceneState, recomputeStage } from './lib/sceneState'
import { hasWebGL } from './lib/env'
import { useFinePointer, useIsMobile, useReducedMotion } from './hooks/useMediaQuery'

import Preloader from './components/ui/Preloader'
import Header from './components/ui/Header'
import Cursor from './components/ui/Cursor'
import NetworkFallback from './components/three/NetworkFallback'
import Hero from './components/sections/Hero'
import About from './components/sections/About'
import Impact from './components/sections/Impact'
import Initiatives from './components/sections/Initiatives'
import Experience from './components/sections/Experience'
import Expertise from './components/sections/Expertise'
import Research from './components/sections/Research'
import Recognition from './components/sections/Recognition'
import Testimonials from './components/sections/Testimonials'
import Contact from './components/sections/Contact'
import Footer from './components/sections/Footer'

// Three.js is code-split: text and layout paint first, the scene streams in.
const NetworkCanvas = lazy(() => import('./components/three/NetworkCanvas'))

/** Section → network formation (see components/three/formations.js) */
const STAGE_TRIGGERS = ['#about', '#impact', '#experience', '#contact']

export default function App() {
  const webgl = useMemo(() => hasWebGL(), [])
  const reducedMotion = useReducedMotion()
  const isMobile = useIsMobile()
  const finePointer = useFinePointer()

  /* ---------------- Loading ---------------- */
  const [assets, setAssets] = useState({ fonts: false, portrait: false, scene: !webgl })
  const [loaded, setLoaded] = useState(false)
  const progress = (Number(assets.fonts) + Number(assets.portrait) + Number(assets.scene)) / 3

  useEffect(() => {
    let alive = true
    const done = (key) => alive && setAssets((a) => ({ ...a, [key]: true }))
    ;(document.fonts?.ready ?? Promise.resolve()).then(() => done('fonts'))
    const img = new Image()
    img.onload = img.onerror = () => done('portrait')
    img.src = window.innerWidth < 768 ? '/images/rameesha-portrait-560.webp' : '/images/rameesha-portrait-900.webp'
    return () => {
      alive = false
    }
  }, [])

  const onSceneReady = useCallback(() => setAssets((a) => ({ ...a, scene: true })), [])

  const onPreloaderDone = useCallback(() => {
    setLoaded(true)
    sceneState.ready = true
    startScroll()
    ScrollTrigger.refresh()
  }, [])

  /* ---------------- Smooth scroll ---------------- */
  useEffect(() => {
    window.scrollTo(0, 0)
    const destroy = initSmoothScroll()
    stopScroll() // locked while the preloader is up
    return destroy
  }, [])

  /* ---------------- Pointer → WebGL ---------------- */
  useEffect(() => {
    const p = sceneState.pointer
    const onMove = (e) => {
      p.x = (e.clientX / window.innerWidth) * 2 - 1
      p.y = -(e.clientY / window.innerHeight) * 2 + 1
      p.active = e.pointerType === 'mouse' || e.pointerType === 'pen'
      p.lastMove = performance.now()
    }
    const onLeave = () => {
      p.active = false
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
    window.addEventListener('blur', onLeave)
    return () => {
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('blur', onLeave)
    }
  }, [])

  /* ---------------- Scroll → network formations ---------------- */
  useGSAP(() => {
    // Each transition is scrubbed by the section that introduces it.
    STAGE_TRIGGERS.forEach((selector, i) => {
      ScrollTrigger.create({
        trigger: selector,
        start: 'top 85%',
        end: 'top 20%',
        onUpdate: (self) => {
          sceneState.transitions[i] = self.progress
          recomputeStage()
        },
        onRefresh: (self) => {
          sceneState.transitions[i] = self.progress
          recomputeStage()
        },
      })
    })

    // Reading-heavy sections ask the network to step back (data-dim="0..1")
    document.querySelectorAll('[data-dim]').forEach((el) => {
      ScrollTrigger.create({
        trigger: el,
        start: 'top 55%',
        end: 'bottom 45%',
        onToggle: (self) => {
          if (self.isActive) sceneState.dimSections.set(el, parseFloat(el.dataset.dim) || 1)
          else sceneState.dimSections.delete(el)
          sceneState.dim = Math.max(0, ...sceneState.dimSections.values())
        },
      })
    })

    // Layout can shift after fonts / images settle
    const refresh = () => ScrollTrigger.refresh()
    window.addEventListener('load', refresh)
    return () => window.removeEventListener('load', refresh)
  })

  return (
    <>
      {!loaded && <Preloader progress={progress} onDone={onPreloaderDone} />}

      {webgl ? (
        <Suspense fallback={null}>
          <NetworkCanvas onReady={onSceneReady} />
        </Suspense>
      ) : (
        <NetworkFallback />
      )}

      {finePointer && !isMobile && !reducedMotion && <Cursor />}
      <Header />

      <main id="main" className="relative z-10" tabIndex={-1}>
        <Hero ready={loaded} />
        <About />
        <Impact />
        <Initiatives />
        <Experience />
        <Expertise />
        <Research />
        <Recognition />
        <Testimonials />
        <Contact />
      </main>
      <div className="relative z-10">
        <Footer />
      </div>
    </>
  )
}
