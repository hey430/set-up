/**
 * Global site configuration & feature flags.
 * Everything a non-developer may need to switch lives here.
 */
export const SITE = {
  name: 'Rameesha Fatima',
  monogram: 'RF',
  role: 'HR Strategy Lead · People & Culture',
  email: 'Rameeshafatima0@gmail.com',
  linkedin: 'https://www.linkedin.com/in/rameesha-fatima',
  linkedinLabel: 'linkedin.com/in/rameesha-fatima',
  location: 'Karachi, Pakistan',
  availability: 'Open to remote work with international teams',
  timeZone: 'Asia/Karachi',
  // SWAP: live domain (also update index.html, robots.txt and sitemap.xml)
  url: 'https://rameeshafatima.com',
}

/** Feature flags */
export const FLAGS = {
  // Testimonials are hidden until real, approved quotes are supplied.
  // Set to true once src/data/content.js → testimonials contains real quotes.
  SHOW_TESTIMONIALS: false,
}

/**
 * Contact form delivery.
 * Leave empty to fall back to opening the visitor's email client (mailto) with
 * the message pre-filled. To receive submissions directly, paste a Formspree
 * (https://formspree.io) or similar JSON endpoint here, e.g.
 * 'https://formspree.io/f/xxxxxxx'.
 */
export const FORM_ENDPOINT = ''

/** 3D network tuning */
export const NETWORK = {
  nodesDesktop: 250, // one node per employee in the TalentX programme
  nodesMobile: 80,
  maxDprDesktop: 2,
  maxDprMobile: 1.5,
}
