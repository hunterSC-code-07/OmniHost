/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'on-error': '#690005',
        'outline-variant': '#4d4732',
        'on-primary': '#003814',
        'tertiary-container': '#dcd9d9',
        primary: '#e8f5e9',
        'surface-bright': '#393939',
        surface: '#131313',
        outline: '#999077',
        'on-surface': '#e5e2e1',
        'on-background': '#e5e2e1',
        'primary-container': '#4CAF50',
        'inverse-on-surface': '#313030',
        'on-secondary-fixed': '#1b1b1c',
        'primary-fixed': '#81C784',
        background: '#131313',
        'error-container': '#93000a',
        secondary: '#c8c6c5',
        'secondary-fixed': '#e5e2e1',
        'surface-container-lowest': '#0e0e0e',
        'primary-fixed-dim': '#4CAF50',
        'surface-container': '#201f1f',
        'inverse-primary': '#1b5e20',
        'inverse-surface': '#e5e2e1',
        'on-tertiary': '#303030',
        'on-secondary': '#303030',
        tertiary: '#f8f6f5',
        'on-tertiary-fixed-variant': '#474746',
        'on-primary-fixed': '#00210b',
        'secondary-fixed-dim': '#c8c6c5',
        error: '#ffb4ab',
        'on-primary-container': '#0f5223',
        'on-surface-variant': '#d0c6ab',
        'surface-container-high': '#2a2a2a',
        'surface-tint': '#4CAF50',
        'secondary-container': '#474746',
        'on-tertiary-fixed': '#1b1c1c',
        'tertiary-fixed-dim': '#c8c6c5',
        'on-secondary-container': '#b7b5b4',
        'on-error-container': '#ffdad6',
        'surface-container-highest': '#353534',
        'on-tertiary-container': '#5f5f5f',
        'on-primary-fixed-variant': '#00521c',
        'on-secondary-fixed-variant': '#474746',
        'surface-variant': '#353534',
        'surface-container-low': '#1c1b1b',
        'surface-dim': '#131313',
        'tertiary-fixed': '#e4e2e1',
        brand: '#4CAF50' // kept for legacy components
      },
      borderRadius: {
        DEFAULT: '0.125rem',
        lg: '0.25rem',
        xl: '0.5rem',
        full: '0.75rem'
      },
      spacing: {
        gutter: '24px',
        'stack-sm': '12px',
        'container-max': '1440px',
        'margin-mobile': '16px',
        'stack-md': '24px',
        'stack-lg': '48px',
        base: '8px',
        'margin-desktop': '40px'
      },
      fontFamily: {
        'headline-lg': ['Sora', 'sans-serif'],
        'label-sm': ['JetBrains Mono', 'monospace'],
        'headline-xl': ['Sora', 'sans-serif'],
        'body-sm': ['Hanken Grotesk', 'sans-serif'],
        'label-md': ['JetBrains Mono', 'monospace'],
        'headline-lg-mobile': ['Sora', 'sans-serif'],
        'body-md': ['Hanken Grotesk', 'sans-serif'],
        'headline-md': ['Sora', 'sans-serif'],
        'body-lg': ['Hanken Grotesk', 'sans-serif'],
        sans: ['Andante', 'sans-serif'] // kept for logo
      },
      fontSize: {
        'headline-lg': [
          '32px',
          { lineHeight: '40px', letterSpacing: '-0.01em', fontWeight: '700' }
        ],
        'label-sm': ['12px', { lineHeight: '14px', letterSpacing: '0.03em', fontWeight: '500' }],
        'headline-xl': [
          '48px',
          { lineHeight: '56px', letterSpacing: '-0.02em', fontWeight: '800' }
        ],
        'body-sm': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'label-md': ['14px', { lineHeight: '16px', letterSpacing: '0.05em', fontWeight: '500' }],
        'headline-lg-mobile': ['24px', { lineHeight: '32px', fontWeight: '700' }],
        'body-md': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'headline-md': ['20px', { lineHeight: '28px', fontWeight: '600' }],
        'body-lg': ['18px', { lineHeight: '28px', fontWeight: '400' }]
      }
    }
  },
  plugins: []
}
