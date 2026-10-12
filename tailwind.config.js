/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    screens: {
      // Project breakpoints: mobile < 768, tablet 768–1199, desktop 1200+
      md: '768px',
      lg: '1024px',
      xl: '1200px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        paper: '#F6F2EC', // warm off-white background
        'paper-deep': '#EFE9E1', // card / raised surface
        ink: '#1E1E1E', // soft charcoal text
        muted: '#655E57', // secondary text (AA on paper: 5.7:1)
        stone: '#D9D6D1', // warm grey, echoes the turtleneck
        'stone-deep': '#B7B0A8',
        terracotta: '#C8473A', // accent: large type, numbers, cursor, decoration
        'terracotta-deep': '#A63A2F', // accent for small text & button fills (AA)
        teal: '#1F4E4F', // contrast sections
        'teal-soft': '#A9C4C0',
      },
      fontFamily: {
        serif: ['Fraunces', 'Georgia', 'Times New Roman', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        // Fluid type scale (min @ 375px → max @ 1440px)
        'fluid-xs': ['clamp(0.75rem, 0.72rem + 0.15vw, 0.8125rem)', { lineHeight: '1.5' }],
        'fluid-sm': ['clamp(0.875rem, 0.84rem + 0.15vw, 0.9375rem)', { lineHeight: '1.6' }],
        'fluid-base': ['clamp(1rem, 0.96rem + 0.2vw, 1.125rem)', { lineHeight: '1.65' }],
        'fluid-lg': ['clamp(1.125rem, 1.03rem + 0.45vw, 1.375rem)', { lineHeight: '1.55' }],
        'fluid-xl': ['clamp(1.375rem, 1.18rem + 0.9vw, 1.875rem)', { lineHeight: '1.35' }],
        'fluid-2xl': ['clamp(1.75rem, 1.4rem + 1.6vw, 2.75rem)', { lineHeight: '1.15' }],
        'fluid-3xl': ['clamp(2.25rem, 1.6rem + 3vw, 4.25rem)', { lineHeight: '1.05' }],
        'fluid-4xl': ['clamp(2.75rem, 1.7rem + 4.8vw, 6rem)', { lineHeight: '1' }],
        'fluid-hero': ['clamp(3.5rem, 10vw, 12rem)', { lineHeight: '0.9' }],
      },
      letterSpacing: {
        tightest: '-0.045em',
      },
      transitionTimingFunction: {
        'out-power3': 'cubic-bezier(0.215, 0.61, 0.355, 1)',
        'in-out-expo': 'cubic-bezier(0.87, 0, 0.13, 1)',
      },
      maxWidth: {
        site: '90rem',
      },
    },
  },
  plugins: [],
}
