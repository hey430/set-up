/**
 * GLSL for the Thriving Network.
 *
 * Nodes are camera-facing quads on a single InstancedMesh. The fragment shader
 * draws a "pearl" sphere impostor (soft diffuse + sheen + rim) and blurs its
 * edge based on distance from the focal plane: a cheap, single-pass depth of
 * field with no post-processing.
 */

export const nodeVertex = /* glsl */ `
  attribute vec3 aOffset;
  attribute vec3 aColor;
  attribute float aScale;
  attribute float aActive;

  uniform float uFocus;
  uniform float uBlurRange;
  uniform float uFogNear;
  uniform float uFogFar;

  varying vec2 vUv;
  varying vec3 vColor;
  varying float vBlur;
  varying float vActive;
  varying float vFog;

  void main() {
    vUv = uv;
    vColor = aColor;
    vActive = aActive;

    vec4 mv = modelViewMatrix * vec4(aOffset, 1.0);
    float depth = -mv.z;
    vBlur = clamp(abs(depth - uFocus) / uBlurRange, 0.0, 1.0);
    vFog = smoothstep(uFogNear, uFogFar, depth) * 0.7;

    // Defocused nodes grow a little (bokeh), active nodes swell gently.
    float s = aScale * (1.0 + aActive * 0.45) * (1.0 + vBlur * 0.85) * 1.6;
    mv.xy += position.xy * s;
    gl_Position = projectionMatrix * mv;
  }
`

export const nodeFragment = /* glsl */ `
  uniform vec3 uBg;
  uniform float uOpacity;

  varying vec2 vUv;
  varying vec3 vColor;
  varying float vBlur;
  varying float vActive;
  varying float vFog;

  void main() {
    // Quad spans 1.6x the sphere radius so the glow has room.
    vec2 p = (vUv * 2.0 - 1.0) * 1.6;
    float r = length(p);

    float soft = mix(0.05, 0.85, vBlur);
    float body = 1.0 - smoothstep(1.0 - soft, 1.0 + soft * 0.3, r);

    // Pearl impostor shading
    float rr = min(r * r, 1.0);
    vec3 n = normalize(vec3(p, sqrt(1.0 - rr)));
    vec3 l = normalize(vec3(-0.45, 0.6, 0.75));
    float diff = 0.64 + 0.36 * max(dot(n, l), 0.0);
    float sheen = pow(max(dot(reflect(-l, n), vec3(0.0, 0.0, 1.0)), 0.0), 14.0) * 0.4;
    float rim = pow(1.0 - n.z, 2.5) * 0.22;
    vec3 col = vColor * diff + vec3(1.0, 0.96, 0.92) * (sheen + rim) * (1.0 - vBlur);
    col = mix(col, vColor * 0.95 + 0.04, vBlur * 0.6); // out of focus = flatter
    col = mix(col, uBg, vFog);                         // atmospheric depth

    // Soft halo, stronger when the node is "connected"
    float halo = exp(-max(r - 1.0, 0.0) * 3.2) * (1.0 - body) * (0.08 + vActive * 0.32);
    halo *= 1.0 - smoothstep(1.25, 1.58, r);

    float alpha = body * mix(0.96, 0.42, vBlur) * (1.0 - vFog * 0.5) + halo;
    vec3 outCol = mix(col, mix(vColor, vec3(1.0, 0.93, 0.88), 0.35), clamp(halo / max(alpha, 1e-4), 0.0, 1.0));

    alpha *= uOpacity;
    if (alpha < 0.004) discard;
    gl_FragColor = vec4(outCol, alpha);
    #include <colorspace_fragment>
  }
`

export const lineVertex = /* glsl */ `
  attribute vec3 aColor;
  attribute float aAlpha;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vColor = aColor;
    vAlpha = aAlpha;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export const lineFragment = /* glsl */ `
  uniform float uOpacity;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    float a = vAlpha * uOpacity;
    if (a < 0.003) discard;
    gl_FragColor = vec4(vColor, a);
    #include <colorspace_fragment>
  }
`
