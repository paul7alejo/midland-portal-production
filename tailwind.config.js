/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: '#0B2A3C',
        'navy-light': '#1a3f58',
        'deep-teal': '#0B5C6C',
        seafoam: '#74C0A2',
        'seafoam-pale': '#EAF3E8',
        cream: '#FDFCF5',
        charcoal: '#333333',
        sand: '#E6D3A3',
        'sand-pale': '#FFF8E7',
        amber: '#F59E0B',
      },
      fontFamily: {
        display: ['Cormorant Garamond', 'serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
