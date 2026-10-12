/** Static image shown when WebGL is unavailable or the scene crashes. */
export default function NetworkFallback() {
  return (
    <div className="network-layer" aria-hidden="true">
      <img
        src="/images/network-fallback.svg"
        alt=""
        className="h-full w-full object-cover opacity-70"
        decoding="async"
      />
    </div>
  )
}
