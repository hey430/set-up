/** Small environment helpers (safe to call during render). */

export const isBrowser = typeof window !== 'undefined'

/** Resolve a file in /public against Vite's base (works at a domain root or a sub-path). */
export const asset = (path) => `${import.meta.env.BASE_URL}${path}`

export function prefersReducedMotion() {
  return isBrowser && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function isMobileViewport() {
  return isBrowser && window.matchMedia('(max-width: 767px)').matches
}

export function hasFinePointer() {
  return isBrowser && window.matchMedia('(hover: hover) and (pointer: fine)').matches
}

export function hasWebGL() {
  if (!isBrowser) return false
  try {
    const canvas = document.createElement('canvas')
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl2') || canvas.getContext('webgl'))
    )
  } catch {
    return false
  }
}
