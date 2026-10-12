import { useEffect, useRef, useState } from 'react'
import { hasFinePointer, prefersReducedMotion } from '../../lib/env'

/* A deliberately tiny raw-WebGL renderer: one quad, one texture, one shader.
   Cheaper than a second three.js scene for a single hover effect. */

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`

// Very gentle ripple from the pointer: a few pixels at most, so her face is
// never visibly distorted. uHover eases in and out.
const FRAG = `
precision mediump float;
uniform sampler2D uTex;
uniform vec2 uMouse;
uniform float uHover;
uniform float uTime;
uniform float uAspect;
varying vec2 vUv;
void main() {
  vec2 uv = vUv;
  vec2 delta = uv - uMouse;
  delta.x *= uAspect;
  float d = length(delta);
  float wave = sin(d * 42.0 - uTime * 3.0) * exp(-d * 6.0);
  uv += normalize(delta + 1e-5) * wave * 0.0035 * uHover;
  uv.x += sin(uv.y * 9.0 + uTime * 1.2) * 0.0008 * uHover;
  gl_FragColor = texture2D(uTex, uv);
}
`

function compile(gl, type, src) {
  const s = gl.createShader(type)
  gl.shaderSource(s, src)
  gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s))
  return s
}

/**
 * Cut-out portrait with a subtle ripple shader on hover.
 * The <img> stays in the DOM for alt text, SEO and as the no-WebGL fallback.
 */
export default function RipplePortrait({ alt, className = '' }) {
  const wrap = useRef(null)
  const img = useRef(null)
  const canvas = useRef(null)
  const [glReady, setGlReady] = useState(false)

  useEffect(() => {
    if (!hasFinePointer() || prefersReducedMotion()) return
    const el = wrap.current
    let cleanup = () => {}

    const init = () => {
      const image = img.current
      const cv = canvas.current
      const gl = cv.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false })
      if (!gl) return
      let program
      try {
        program = gl.createProgram()
        gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERT))
        gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAG))
        gl.linkProgram(program)
        gl.useProgram(program)
      } catch (err) {
        console.warn('[RipplePortrait] shader failed', err)
        return
      }

      const buf = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, buf)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
      const aPos = gl.getAttribLocation(program, 'aPos')
      gl.enableVertexAttribArray(aPos)
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

      const tex = gl.createTexture()
      gl.bindTexture(gl.TEXTURE_2D, tex)
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)

      const u = {
        mouse: gl.getUniformLocation(program, 'uMouse'),
        hover: gl.getUniformLocation(program, 'uHover'),
        time: gl.getUniformLocation(program, 'uTime'),
        aspect: gl.getUniformLocation(program, 'uAspect'),
      }

      const state = { hover: 0, target: 0, mx: 0.5, my: 0.5, raf: 0, start: performance.now() }

      const resize = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        const r = cv.getBoundingClientRect()
        cv.width = Math.max(1, Math.round(r.width * dpr))
        cv.height = Math.max(1, Math.round(r.height * dpr))
        gl.viewport(0, 0, cv.width, cv.height)
        gl.uniform1f(u.aspect, r.width / Math.max(1, r.height))
        draw()
      }

      const draw = () => {
        gl.clearColor(0, 0, 0, 0)
        gl.clear(gl.COLOR_BUFFER_BIT)
        gl.uniform2f(u.mouse, state.mx, state.my)
        gl.uniform1f(u.hover, state.hover)
        gl.uniform1f(u.time, (performance.now() - state.start) / 1000)
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      }

      const loop = () => {
        state.hover += (state.target - state.hover) * 0.06
        draw()
        if (state.target === 0 && state.hover < 0.002) {
          state.hover = 0
          draw()
          state.raf = 0
          return
        }
        state.raf = requestAnimationFrame(loop)
      }
      const kick = () => {
        if (!state.raf) state.raf = requestAnimationFrame(loop)
      }

      const onMove = (e) => {
        const r = cv.getBoundingClientRect()
        state.mx = (e.clientX - r.left) / r.width
        state.my = 1 - (e.clientY - r.top) / r.height
        state.target = 1
        kick()
      }
      const onLeave = () => {
        state.target = 0
        kick()
      }

      const ro = new ResizeObserver(resize)
      ro.observe(cv)
      el.addEventListener('pointermove', onMove)
      el.addEventListener('pointerleave', onLeave)
      resize()
      setGlReady(true)

      cleanup = () => {
        cancelAnimationFrame(state.raf)
        ro.disconnect()
        el.removeEventListener('pointermove', onMove)
        el.removeEventListener('pointerleave', onLeave)
        gl.deleteTexture(tex)
        gl.deleteBuffer(buf)
        gl.deleteProgram(program)
        gl.getExtension('WEBGL_lose_context')?.loseContext()
      }
    }

    // Only spin up WebGL once the portrait is near the viewport and decoded
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        io.disconnect()
        const image = img.current
        if (image.complete && image.naturalWidth) init()
        else image.addEventListener('load', init, { once: true })
      },
      { rootMargin: '200px' },
    )
    io.observe(el)

    return () => {
      io.disconnect()
      cleanup()
    }
  }, [])

  return (
    <div ref={wrap} className={`relative ${className}`} data-cursor="Hello">
      <img
        ref={img}
        src="/images/rameesha-portrait-900.webp"
        srcSet="/images/rameesha-portrait-560.webp 560w, /images/rameesha-portrait-900.webp 900w"
        sizes="(min-width: 1200px) 34vw, (min-width: 768px) 42vw, 88vw"
        width="900"
        height="909"
        alt={alt}
        loading="lazy"
        decoding="async"
        className={`relative block h-auto w-full transition-opacity duration-300 ${glReady ? 'opacity-0' : 'opacity-100'}`}
      />
      <canvas
        ref={canvas}
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 h-full w-full ${glReady ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  )
}
