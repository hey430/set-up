import { useRef, useState } from 'react'
import { FORM_ENDPOINT, SITE } from '../../config/site'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const FIELDS = [
  { name: 'name', label: 'Your name', type: 'text', autoComplete: 'name', required: true },
  { name: 'email', label: 'Email', type: 'email', autoComplete: 'email', required: true },
  { name: 'company', label: 'Company', type: 'text', autoComplete: 'organization', required: false },
  { name: 'message', label: 'How can I help?', type: 'textarea', required: true },
]

function validate(name, value) {
  const v = value.trim()
  switch (name) {
    case 'name':
      return v.length < 2 ? 'Please enter your name.' : ''
    case 'email':
      if (!v) return 'Please enter your email address.'
      return EMAIL_RE.test(v) ? '' : 'That email doesn’t look quite right. Please check it.'
    case 'message':
      return v.length < 10 ? 'Please add a short message (at least 10 characters).' : ''
    default:
      return ''
  }
}

/**
 * Contact form with inline validation (on blur and on submit), accessible
 * error messaging and clear submitting / success / error states.
 * Delivery: FORM_ENDPOINT (e.g. Formspree) if set, otherwise a pre-filled email.
 */
export default function ContactForm() {
  const formRef = useRef(null)
  const [values, setValues] = useState({ name: '', email: '', company: '', message: '' })
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [status, setStatus] = useState('idle') // idle | submitting | success | error

  const onChange = (e) => {
    const { name, value } = e.target
    setValues((v) => ({ ...v, [name]: value }))
    if (touched[name]) setErrors((er) => ({ ...er, [name]: validate(name, value) }))
  }

  const onBlur = (e) => {
    const { name, value } = e.target
    setTouched((t) => ({ ...t, [name]: true }))
    setErrors((er) => ({ ...er, [name]: validate(name, value) }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (e.target.elements.website?.value) return // honeypot: silently drop bots

    const nextErrors = Object.fromEntries(FIELDS.map((f) => [f.name, validate(f.name, values[f.name])]))
    setErrors(nextErrors)
    setTouched(Object.fromEntries(FIELDS.map((f) => [f.name, true])))
    const firstInvalid = FIELDS.find((f) => nextErrors[f.name])
    if (firstInvalid) {
      formRef.current.elements[firstInvalid.name].focus()
      return
    }

    setStatus('submitting')
    try {
      if (FORM_ENDPOINT) {
        const res = await fetch(FORM_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(values),
        })
        if (!res.ok) throw new Error(`Request failed: ${res.status}`)
      } else {
        const subject = `Enquiry from ${values.name}${values.company ? ` (${values.company})` : ''}`
        const body = `${values.message}\n\n${values.name}\n${values.email}${values.company ? `\n${values.company}` : ''}`
        window.location.href = `mailto:${SITE.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
      }
      setStatus('success')
      setValues({ name: '', email: '', company: '', message: '' })
      setTouched({})
    } catch (err) {
      console.error(err)
      setStatus('error')
    }
  }

  const fieldClass = (name) =>
    `peer mt-2 block w-full rounded-none border-0 border-b bg-transparent px-0 py-3 text-fluid-base text-ink placeholder:text-muted/70 focus:outline-none focus:ring-0 transition-colors duration-300 ${
      errors[name] ? 'border-terracotta-deep' : touched[name] && values[name] ? 'border-teal' : 'border-ink/25 focus:border-ink'
    }`

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-7" aria-describedby="form-status">
      {/* Honeypot (hidden from people and assistive tech) */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="grid gap-7 sm:grid-cols-2">
        {FIELDS.filter((f) => f.type !== 'textarea').map((f) => (
          <div key={f.name} className={f.name === 'company' ? 'sm:col-span-2' : ''}>
            <label htmlFor={`f-${f.name}`} className="text-fluid-xs font-medium uppercase tracking-[0.14em] text-muted">
              {f.label}
              {f.required ? <span className="text-terracotta-deep"> *</span> : <span className="normal-case tracking-normal"> (optional)</span>}
            </label>
            <input
              id={`f-${f.name}`}
              name={f.name}
              type={f.type}
              autoComplete={f.autoComplete}
              required={f.required}
              value={values[f.name]}
              onChange={onChange}
              onBlur={onBlur}
              aria-invalid={!!errors[f.name]}
              aria-describedby={errors[f.name] ? `e-${f.name}` : undefined}
              className={fieldClass(f.name)}
            />
            {errors[f.name] && (
              <p id={`e-${f.name}`} className="mt-2 text-fluid-xs text-terracotta-deep">
                {errors[f.name]}
              </p>
            )}
          </div>
        ))}
      </div>

      <div>
        <label htmlFor="f-message" className="text-fluid-xs font-medium uppercase tracking-[0.14em] text-muted">
          How can I help?<span className="text-terracotta-deep"> *</span>
        </label>
        <textarea
          id="f-message"
          name="message"
          rows={4}
          required
          value={values.message}
          onChange={onChange}
          onBlur={onBlur}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? 'e-message' : undefined}
          className={`${fieldClass('message')} resize-y`}
          placeholder="A few lines about your team and what you need."
        />
        {errors.message && (
          <p id="e-message" className="mt-2 text-fluid-xs text-terracotta-deep">
            {errors.message}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-5">
        <button type="submit" className="btn-primary" disabled={status === 'submitting'} data-cursor="Send">
          {status === 'submitting' ? 'Sending…' : 'Send message'}
          <span aria-hidden="true">→</span>
        </button>
        <p id="form-status" role="status" aria-live="polite" className="text-fluid-sm">
          {status === 'success' &&
            (FORM_ENDPOINT
              ? 'Thank you. Your message is on its way and I’ll reply soon.'
              : 'Thank you. Your email app should open with your message ready to send.')}
          {status === 'error' && (
            <span className="text-terracotta-deep">
              Something went wrong. Please email me directly at {SITE.email}.
            </span>
          )}
        </p>
      </div>
    </form>
  )
}
