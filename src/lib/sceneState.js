/**
 * Shared, mutable state bridging the DOM (GSAP / ScrollTrigger / pointer) and
 * the WebGL render loop. Plain object on purpose: written from scroll and
 * pointer handlers, read every frame in useFrame, never triggers React renders.
 */
export const STAGES = ['hero', 'about', 'impact', 'experience', 'contact']

export const sceneState = {
  /** Scroll-driven formation index, 0 (hero) → 4 (contact). Fractional while transitioning. */
  stage: 0,
  /** Per-transition progress written by ScrollTrigger (summed into `stage`). */
  transitions: [0, 0, 0, 0],
  /** 1 when a reading-heavy section is in view, so the network steps back. */
  dim: 0,
  dimSections: new Map(), // element → dim level (0..1)
  /** Pointer in normalized device coords (-1..1), plus last-move timestamp. */
  pointer: { x: 0, y: 0, active: false, lastMove: 0 },
  /** Set once the preloader has finished, fades the network in. */
  ready: false,
}

if (import.meta.env.DEV) window.__scene = sceneState

export function recomputeStage() {
  sceneState.stage = sceneState.transitions.reduce((a, b) => a + b, 0)
}
