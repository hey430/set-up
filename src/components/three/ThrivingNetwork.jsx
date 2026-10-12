import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { sceneState } from '../../lib/sceneState'
import {
  buildFormations,
  buildNodeMeta,
  latLonToUnit,
  HUBS,
  NODE_PALETTE,
  GLOBE_CENTER_LON,
  GLOBE_TILT,
} from './formations'
import { nodeVertex, nodeFragment, lineVertex, lineFragment } from './shaders'

/* Tuning ------------------------------------------------------------------ */
const MAX_SEGMENTS = 1800 // one buffer for every line in the scene
const POINTER_LINK_DIST = 1.55 // world units: how close two people must be to "connect"
const POINTER_RADIUS = [0.1, 0.34] // NDC: full → no activation around the cursor
const MAX_ACTIVE = 70 // cap for the O(n²) pointer-link pass
const CAMERA_Z = [12, 11.6, 12.4, 11.4, 12.2] // gentle dolly per stage
const REDUCED_MOTION_STAGE = 1 // static "teams" view when motion is reduced
const DEG = Math.PI / 180

const COLOR_STRUCT = new THREE.Color().setStyle('#8C8279', THREE.SRGBColorSpace)
const COLOR_LINK = new THREE.Color().setStyle('#C8473A', THREE.SRGBColorSpace)
const COLOR_BG = new THREE.Color().setStyle('#F6F2EC', THREE.SRGBColorSpace)

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v)
const smoothstep = (a, b, v) => {
  const t = clamp01((v - a) / (b - a))
  return t * t * (3 - 2 * t)
}
const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const damp = THREE.MathUtils.damp

/**
 * @param {number}  count         number of nodes (250 desktop / 80 mobile)
 * @param {boolean} interactive   pointer-driven connections (fine pointer only)
 * @param {boolean} reducedMotion static network, no drift or scroll choreography
 * @param {boolean} isMobile      mobile-friendly layouts
 */
export default function ThrivingNetwork({ count, interactive, reducedMotion, isMobile }) {
  const { size, camera, invalidate } = useThree()

  /* Visible world size at z = 0 for the fixed camera */
  const view = useMemo(() => {
    const vh = 2 * Math.tan((camera.fov * DEG) / 2) * CAMERA_Z[0]
    return { vh, vw: vh * (size.width / size.height) }
  }, [size.width, size.height, camera.fov])

  const meta = useMemo(() => buildNodeMeta(count), [count])
  const F = useMemo(() => buildFormations(meta, view, isMobile), [meta, view, isMobile])

  /* Node geometry: one quad, instanced. Custom per-instance attributes. */
  const { nodeGeo, nodeMat, offsets, actives } = useMemo(() => {
    const geo = new THREE.PlaneGeometry(1, 1)
    const offsets = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const actives = new Float32Array(count)
    const c = new THREE.Color()
    for (let i = 0; i < count; i++) {
      c.setStyle(NODE_PALETTE[meta.colorIndex[i]].hex, THREE.SRGBColorSpace)
      colors.set([c.r, c.g, c.b], i * 3)
    }
    geo.setAttribute('aOffset', new THREE.InstancedBufferAttribute(offsets, 3).setUsage(THREE.DynamicDrawUsage))
    geo.setAttribute('aColor', new THREE.InstancedBufferAttribute(colors, 3))
    geo.setAttribute('aScale', new THREE.InstancedBufferAttribute(meta.scale, 1))
    geo.setAttribute('aActive', new THREE.InstancedBufferAttribute(actives, 1).setUsage(THREE.DynamicDrawUsage))

    const mat = new THREE.ShaderMaterial({
      vertexShader: nodeVertex,
      fragmentShader: nodeFragment,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uFocus: { value: CAMERA_Z[0] },
        uBlurRange: { value: 6.5 },
        uFogNear: { value: 13 },
        uFogFar: { value: 20 },
        uBg: { value: COLOR_BG },
        uOpacity: { value: 0 },
      },
    })
    return { nodeGeo: geo, nodeMat: mat, offsets, actives }
  }, [count, meta])

  /* Lines: a single LineSegments buffer for structural + pointer links */
  const { lineGeo, lineMat, linePos, lineCol, lineAlpha } = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const linePos = new Float32Array(MAX_SEGMENTS * 2 * 3)
    const lineCol = new Float32Array(MAX_SEGMENTS * 2 * 3)
    const lineAlpha = new Float32Array(MAX_SEGMENTS * 2)
    geo.setAttribute('position', new THREE.BufferAttribute(linePos, 3).setUsage(THREE.DynamicDrawUsage))
    geo.setAttribute('aColor', new THREE.BufferAttribute(lineCol, 3).setUsage(THREE.DynamicDrawUsage))
    geo.setAttribute('aAlpha', new THREE.BufferAttribute(lineAlpha, 1).setUsage(THREE.DynamicDrawUsage))
    geo.setDrawRange(0, 0)
    const mat = new THREE.ShaderMaterial({
      vertexShader: lineVertex,
      fragmentShader: lineFragment,
      transparent: true,
      depthWrite: false,
      uniforms: { uOpacity: { value: 0 } },
    })
    return { lineGeo: geo, lineMat: mat, linePos, lineCol, lineAlpha }
  }, [])

  /* Great-circle arcs from Karachi to the other three countries */
  const arcs = useMemo(() => {
    const SEG = 64
    const from = latLonToUnit(HUBS[0].lat, HUBS[0].lon)
    const a = new THREE.Vector3(...from)
    return HUBS.slice(1).map((h) => {
      const b = new THREE.Vector3(...latLonToUnit(h.lat, h.lon))
      const pts = new Float32Array((SEG + 1) * 3)
      const angle = a.angleTo(b)
      const v = new THREE.Vector3()
      for (let s = 0; s <= SEG; s++) {
        const t = s / SEG
        // Spherical interpolation, lifted off the surface in the middle
        const sa = Math.sin((1 - t) * angle) / Math.sin(angle)
        const sb = Math.sin(t * angle) / Math.sin(angle)
        v.copy(a).multiplyScalar(sa).addScaledVector(b, sb)
        v.multiplyScalar(1.02 + Math.sin(Math.PI * t) * 0.28)
        pts.set([v.x, v.y, v.z], s * 3)
      }
      const geo = new THREE.BufferGeometry()
      geo.setAttribute('position', new THREE.BufferAttribute(pts, 3))
      geo.setDrawRange(0, 0)
      const mat = new THREE.LineBasicMaterial({
        color: new THREE.Color().setStyle('#C8473A', THREE.SRGBColorSpace),
        transparent: true,
        opacity: 0,
        depthWrite: false,
      })
      const line = new THREE.Line(geo, mat)
      line.userData.segments = SEG + 1
      return line
    })
  }, [])

  /* Mutable simulation state */
  const sim = useRef(null)
  if (!sim.current || sim.current.count !== count) {
    const cur = new Float32Array(count * 3)
    // Start further back so nodes drift into place when the site reveals
    for (let i = 0; i < count; i++) {
      cur[i * 3] = F.scatter[i * 3] * 1.3
      cur[i * 3 + 1] = F.scatter[i * 3 + 1] * 1.3
      cur[i * 3 + 2] = F.scatter[i * 3 + 2] - 9
    }
    sim.current = { count, cur, stage: 0, dim: 0, opacity: 0, act: new Float32Array(count), first: true }
  }

  const arcGroup = useRef()

  /* Dispose GPU resources on unmount */
  useEffect(
    () => () => {
      nodeGeo.dispose()
      nodeMat.dispose()
    },
    [nodeGeo, nodeMat],
  )
  useEffect(
    () => () => {
      lineGeo.dispose()
      lineMat.dispose()
      arcs.forEach((l) => {
        l.geometry.dispose()
        l.material.dispose()
      })
    },
    [lineGeo, lineMat, arcs],
  )

  /* With reduced motion the loop is on-demand: render once per layout change */
  useEffect(() => {
    if (reducedMotion) invalidate()
  }, [reducedMotion, invalidate, F])

  const A = useMemo(() => [0, 0, 0], [])
  const B = useMemo(() => [0, 0, 0], [])
  const proj = useMemo(() => new THREE.Vector3(), [])
  const activeList = useMemo(() => new Uint16Array(MAX_ACTIVE), [])

  /** Write formation `k` position for node `i` at time `t` into `out`. */
  const formationPos = (k, i, t, globeRot, out) => {
    const i3 = i * 3
    switch (k) {
      case 0:
        out[0] = F.scatter[i3]
        out[1] = F.scatter[i3 + 1]
        out[2] = F.scatter[i3 + 2]
        return
      case 1:
        out[0] = F.clusters[i3]
        out[1] = F.clusters[i3 + 1]
        out[2] = F.clusters[i3 + 2]
        return
      case 2:
        out[0] = F.curve[i3]
        out[1] = F.curve[i3 + 1]
        out[2] = F.curve[i3 + 2]
        return
      case 3: {
        // Rotate around Y (longitude), then tilt around X so the north leans in
        const x = F.globeUnit[i3]
        const y = F.globeUnit[i3 + 1]
        const z = F.globeUnit[i3 + 2]
        const cy = Math.cos(globeRot)
        const sy = Math.sin(globeRot)
        const x1 = x * cy + z * sy
        const z1 = -x * sy + z * cy
        const ct = Math.cos(GLOBE_TILT)
        const st = Math.sin(GLOBE_TILT)
        const y2 = y * ct - z1 * st
        const z2 = y * st + z1 * ct
        const R = F.globe.radius
        out[0] = F.globe.cx + x1 * R
        out[1] = F.globe.cy + y2 * R
        out[2] = F.globe.cz + z2 * R
        return
      }
      default: {
        const ang = F.ringAngle[i] + t * 0.02
        const rj = F.ringOffset[i * 2]
        out[0] = F.ring.cx + Math.cos(ang) * (F.ring.rx + rj)
        out[1] = F.ring.cy + Math.sin(ang) * (F.ring.ry + rj)
        out[2] = F.ringOffset[i * 2 + 1]
      }
    }
  }

  useFrame((state, delta) => {
    const s = sim.current
    const dt = Math.min(delta, 1 / 20)
    const t = reducedMotion ? 0 : state.clock.elapsedTime
    const snap = reducedMotion || s.first

    /* 1 · Scroll stage (damped so the choreography never snaps) */
    const stageTarget = reducedMotion ? REDUCED_MOTION_STAGE : sceneState.stage
    s.stage = snap ? stageTarget : damp(s.stage, stageTarget, 2.4, dt)
    const stage = Math.min(4, Math.max(0, s.stage))
    const k = Math.min(3, Math.floor(stage))
    const f = stage - k
    const weights = [0, 0, 0, 0, 0]
    weights[k] = 1 - f
    weights[k + 1] = f

    s.dim = snap ? sceneState.dim : damp(s.dim, sceneState.dim, 3, dt)
    const visible = reducedMotion || sceneState.ready ? 1 : 0
    const targetOpacity = visible * (1 - s.dim * 0.78)
    s.opacity = reducedMotion ? targetOpacity : damp(s.opacity, targetOpacity, 1.6, dt)

    const globeRot = -GLOBE_CENTER_LON * DEG + (reducedMotion ? 0 : Math.sin(t * 0.07) * 0.8)
    const driftAmp = F.drift[k] * (1 - f) + F.drift[k + 1] * f

    /* 2 · Node positions: blend formations with a per-node stagger */
    const cur = s.cur
    for (let i = 0; i < count; i++) {
      formationPos(k, i, t, globeRot, A)
      formationPos(k + 1, i, t, globeRot, B)
      const local = clamp01((f - meta.delay[i] * 0.35) / 0.65)
      const e = easeInOutCubic(local)
      const i3 = i * 3
      const sp = meta.speed[i]
      const dx = reducedMotion ? 0 : Math.sin(t * 0.31 * sp + meta.phase[i3]) * driftAmp
      const dy = reducedMotion ? 0 : Math.cos(t * 0.27 * sp + meta.phase[i3 + 1]) * driftAmp
      const dz = reducedMotion ? 0 : Math.sin(t * 0.19 * sp + meta.phase[i3 + 2]) * driftAmp * 0.6
      const tx = A[0] + (B[0] - A[0]) * e + dx
      const ty = A[1] + (B[1] - A[1]) * e + dy
      const tz = A[2] + (B[2] - A[2]) * e + dz
      if (reducedMotion) {
        cur[i3] = tx
        cur[i3 + 1] = ty
        cur[i3 + 2] = tz
      } else {
        // Lerp toward target: organic lag, slightly different per node
        const lambda = 1.6 + sp * 0.9
        cur[i3] = damp(cur[i3], tx, lambda, dt)
        cur[i3 + 1] = damp(cur[i3 + 1], ty, lambda, dt)
        cur[i3 + 2] = damp(cur[i3 + 2], tz, lambda, dt)
      }
      offsets[i3] = cur[i3]
      offsets[i3 + 1] = cur[i3 + 1]
      offsets[i3 + 2] = cur[i3 + 2]
    }

    /* 3 · Activation: people near the cursor (or a slow wandering focus on touch) */
    let px = 0
    let py = 0
    let pointerOn = false
    if (!reducedMotion) {
      if (interactive) {
        px = sceneState.pointer.x
        py = sceneState.pointer.y
        pointerOn = sceneState.pointer.active
      } else {
        // Mobile: slow automatic connections along a lazy Lissajous path
        px = Math.sin(t * 0.11) * 0.62
        py = Math.cos(t * 0.083 + 1.3) * 0.55
        pointerOn = true
      }
    }
    const aspect = size.width / size.height
    const globeW = weights[3]
    let activeCount = 0
    for (let i = 0; i < count; i++) {
      let target = 0
      if (pointerOn) {
        const i3 = i * 3
        proj.set(cur[i3], cur[i3 + 1], cur[i3 + 2]).project(camera)
        const ddx = (proj.x - px) * aspect
        const ddy = proj.y - py
        const d = Math.sqrt(ddx * ddx + ddy * ddy)
        target = 1 - smoothstep(POINTER_RADIUS[0], POINTER_RADIUS[1], d)
      }
      const a = s.act[i]
      // Connect quickly, let go slowly: friendships fade gently
      s.act[i] = reducedMotion ? 0 : damp(a, target, target > a ? 5 : 1.1, dt)
      if (s.act[i] > 0.02 && activeCount < MAX_ACTIVE) activeList[activeCount++] = i
      // Country hubs glow while the globe is formed
      actives[i] = Math.max(s.act[i], F.hub[i] >= 0 ? globeW * 0.75 : 0)
    }

    /* 4 · Lines */
    let seg = 0
    const pushSeg = (a, b, alpha, color) => {
      if (seg >= MAX_SEGMENTS || alpha < 0.004) return
      const o = seg * 6
      const a3 = a * 3
      const b3 = b * 3
      linePos[o] = cur[a3]
      linePos[o + 1] = cur[a3 + 1]
      linePos[o + 2] = cur[a3 + 2]
      linePos[o + 3] = cur[b3]
      linePos[o + 4] = cur[b3 + 1]
      linePos[o + 5] = cur[b3 + 2]
      lineCol[o] = lineCol[o + 3] = color.r
      lineCol[o + 1] = lineCol[o + 4] = color.g
      lineCol[o + 2] = lineCol[o + 5] = color.b
      lineAlpha[seg * 2] = lineAlpha[seg * 2 + 1] = alpha
      seg++
    }

    // Structural links of the formations currently on screen
    for (let fi = 1; fi < 5; fi++) {
      const w = weights[fi]
      if (w < 0.01) continue
      const L = F.links[fi]
      const base = (fi === 4 ? 0.42 : fi === 3 ? 0.3 : 0.36) * smoothstep(0.15, 0.9, w)
      for (let p = 0; p < L.rest.length; p++) {
        const a = L.pairs[p * 2]
        const b = L.pairs[p * 2 + 1]
        const a3 = a * 3
        const b3 = b * 3
        const dx = cur[a3] - cur[b3]
        const dy = cur[a3 + 1] - cur[b3 + 1]
        const dz = cur[a3 + 2] - cur[b3 + 2]
        const d = Math.sqrt(dx * dx + dy * dy + dz * dz)
        const rest = L.rest[p]
        // Lines stretch and fade while people are moving between formations
        const fade = 1 - smoothstep(rest * 1.4 + 0.05, rest * 2.6 + 0.25, d)
        pushSeg(a, b, base * fade, COLOR_STRUCT)
      }
    }

    // Pointer links: friendships forming near the cursor
    for (let ia = 0; ia < activeCount; ia++) {
      const a = activeList[ia]
      const a3 = a * 3
      for (let ib = ia + 1; ib < activeCount; ib++) {
        const b = activeList[ib]
        const b3 = b * 3
        const dx = cur[a3] - cur[b3]
        const dy = cur[a3 + 1] - cur[b3 + 1]
        const dz = cur[a3 + 2] - cur[b3 + 2]
        const d = Math.sqrt(dx * dx + dy * dy + dz * dz)
        if (d > POINTER_LINK_DIST) continue
        const alpha = Math.min(s.act[a], s.act[b]) * (1 - d / POINTER_LINK_DIST) * 0.7
        pushSeg(a, b, alpha, COLOR_LINK)
      }
    }

    lineGeo.setDrawRange(0, seg * 2)
    lineGeo.attributes.position.needsUpdate = true
    lineGeo.attributes.aColor.needsUpdate = true
    lineGeo.attributes.aAlpha.needsUpdate = true
    nodeGeo.attributes.aOffset.needsUpdate = true
    nodeGeo.attributes.aActive.needsUpdate = true
    nodeMat.uniforms.uOpacity.value = s.opacity
    lineMat.uniforms.uOpacity.value = s.opacity

    /* 5 · Globe arcs draw themselves while the globe is formed */
    if (arcGroup.current) {
      const g = arcGroup.current
      g.position.set(F.globe.cx, F.globe.cy, F.globe.cz)
      g.scale.setScalar(F.globe.radius)
      g.rotation.set(GLOBE_TILT, globeRot, 0, 'XYZ')
      const draw = smoothstep(0.35, 0.95, globeW)
      g.visible = draw > 0.001
      arcs.forEach((line, n) => {
        const local = clamp01(draw * 1.35 - n * 0.15)
        line.geometry.setDrawRange(0, Math.floor(line.userData.segments * local))
        line.material.opacity = local * 0.55 * s.opacity
      })
    }

    /* 6 · Camera: subtle parallax + per-stage dolly */
    if (!reducedMotion) {
      const camZ = CAMERA_Z[k] * (1 - f) + CAMERA_Z[k + 1] * f
      const tx = interactive ? sceneState.pointer.x * 0.35 : 0
      const ty = interactive ? sceneState.pointer.y * 0.22 : 0
      camera.position.x = damp(camera.position.x, tx, 1.8, dt)
      camera.position.y = damp(camera.position.y, ty, 1.8, dt)
      camera.position.z = snap ? camZ : damp(camera.position.z, camZ, 1.5, dt)
      camera.lookAt(0, 0, 0)
      nodeMat.uniforms.uFocus.value = camera.position.z
    }

    s.first = false
  })

  return (
    <>
      <instancedMesh args={[nodeGeo, nodeMat, count]} frustumCulled={false} renderOrder={2} />
      <lineSegments args={[lineGeo, lineMat]} frustumCulled={false} renderOrder={1} />
      <group ref={arcGroup} visible={false}>
        {arcs.map((line, i) => (
          <primitive key={i} object={line} frustumCulled={false} />
        ))}
      </group>
    </>
  )
}
