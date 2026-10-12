import { Component, useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import ThrivingNetwork from './ThrivingNetwork'
import { NETWORK } from '../../config/site'
import NetworkFallback from './NetworkFallback'
import { useFinePointer, useIsMobile, useReducedMotion } from '../../hooks/useMediaQuery'

class SceneErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { failed: false }
  }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error) {
    console.warn('[ThrivingNetwork] WebGL scene failed, showing fallback.', error)
    this.props.onFail?.()
  }
  render() {
    return this.state.failed ? <NetworkFallback /> : this.props.children
  }
}

/**
 * Fixed, full-viewport WebGL layer that sits behind all HTML content.
 * Rendering pauses when the tab is hidden or the canvas leaves the viewport.
 */
export default function NetworkCanvas({ onReady }) {
  const isMobile = useIsMobile()
  const finePointer = useFinePointer()
  const reducedMotion = useReducedMotion()
  const wrapRef = useRef(null)
  const [inView, setInView] = useState(true)
  const [tabVisible, setTabVisible] = useState(() => document.visibilityState !== 'hidden')
  const maxDpr = isMobile ? NETWORK.maxDprMobile : NETWORK.maxDprDesktop
  const [dpr, setDpr] = useState(Math.min(window.devicePixelRatio || 1, maxDpr))

  useEffect(() => setDpr(Math.min(window.devicePixelRatio || 1, maxDpr)), [maxDpr])

  // Pause when the tab is hidden
  useEffect(() => {
    const onVis = () => setTabVisible(document.visibilityState !== 'hidden')
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  // Sections with an opaque background (e.g. Research) announce when they
  // fully cover the viewport, so we can stop rendering behind them.
  const [covered, setCovered] = useState(false)
  useEffect(() => {
    const onCover = (e) => setCovered(!!e.detail)
    window.addEventListener('network:cover', onCover)
    return () => window.removeEventListener('network:cover', onCover)
  }, [])

  // Pause when the canvas is scrolled out of view
  useEffect(() => {
    if (!wrapRef.current || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0 })
    io.observe(wrapRef.current)
    return () => io.disconnect()
  }, [])

  const frameloop = reducedMotion ? 'demand' : tabVisible && inView && !covered ? 'always' : 'never'
  const count = isMobile ? NETWORK.nodesMobile : NETWORK.nodesDesktop

  return (
    <div ref={wrapRef} className="network-layer" aria-hidden="true">
      <SceneErrorBoundary onFail={onReady}>
        <Canvas
          frameloop={frameloop}
          dpr={dpr}
          camera={{ position: [0, 0, 12], fov: 35, near: 0.1, far: 60 }}
          gl={{
            antialias: !isMobile,
            alpha: true,
            powerPreference: 'high-performance',
            stencil: false,
            depth: false,
          }}
          onCreated={({ gl }) => {
            gl.setClearColor(0x000000, 0)
            onReady?.()
          }}
        >
          <PerformanceMonitor
            onDecline={() => setDpr((d) => Math.max(1, d - 0.5))}
            onIncline={() => setDpr((d) => Math.min(maxDpr, d + 0.25))}
            flipflops={3}
            onFallback={() => setDpr(1)}
          />
          <ThrivingNetwork
            key={count}
            count={count}
            isMobile={isMobile}
            interactive={finePointer && !isMobile}
            reducedMotion={reducedMotion}
          />
        </Canvas>
      </SceneErrorBoundary>
    </div>
  )
}
