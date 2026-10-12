import { useEffect, useState } from 'react'
import { scrollToTarget } from '../../lib/scroll'
import { SITE } from '../../config/site'

function useKarachiTime() {
  const format = () =>
    new Intl.DateTimeFormat('en-GB', {
      timeZone: SITE.timeZone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(new Date())
  const [time, setTime] = useState(format)
  useEffect(() => {
    const id = setInterval(() => setTime(format()), 1000)
    return () => clearInterval(id)
  }, [])
  return time
}

/** Footer: copyright, live Karachi time, back to top. */
export default function Footer() {
  const time = useKarachiTime()
  const year = new Date().getFullYear()

  return (
    <footer className="relative border-t border-ink/15 bg-paper/70 backdrop-blur-sm">
      <div className="container-site flex flex-col gap-6 py-10 text-fluid-sm md:flex-row md:items-center md:justify-between">
        <p>
          © {year} {SITE.name}
        </p>
        <p className="flex items-center gap-2 text-muted">
          <span aria-hidden="true" className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-terracotta opacity-50" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-terracotta" />
          </span>
          Karachi, <time className="tabular-nums" aria-live="off">{time}</time> PKT
        </p>
        <button
          type="button"
          onClick={() => scrollToTarget(0)}
          className="group inline-flex min-h-[44px] items-center gap-3 self-start uppercase tracking-[0.16em] md:self-auto"
          data-cursor="Top"
        >
          Back to top
          <span
            aria-hidden="true"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/20 transition-colors duration-300 group-hover:border-terracotta group-hover:bg-terracotta group-hover:text-paper"
          >
            ↑
          </span>
        </button>
      </div>
    </footer>
  )
}
