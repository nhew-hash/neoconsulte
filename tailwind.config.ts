module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}', './lib/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#5eead4',
          600: '#2dd4bf',
          700: '#0f766e',
        },
        graphite: {
          950: '#070b14',
          900: '#0d1320',
          800: '#151d2a',
          700: '#1b2637',
          600: '#243247',
        },
      },
      boxShadow: {
        soft: '0 20px 40px rgba(15, 23, 42, 0.28)',
      },
      backgroundImage: {
        'grid-fade': 'radial-gradient(circle at top, rgba(94,234,212,0.12), transparent 42%)',
      },
    },
  },
  plugins: [],
};
