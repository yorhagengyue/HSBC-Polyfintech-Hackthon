/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'hsbc-red': '#EE3124',
        'hsbc-red-dark': '#D61F1F',
        'hsbc-gray': '#333333',
        'hsbc-light-gray': '#f5f5f5',
        'alert-red': '#DC2626',
        'alert-yellow': '#ffc400',
        'alert-green': '#10B981',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      fontSize: {
        // Fluid typography using CSS clamp
        'display': 'clamp(1.1rem, 0.9rem + 0.6vw, 1.6rem)',
        'body': 'clamp(0.82rem, 0.74rem + 0.3vw, 1rem)',
        'small': 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)',
        'large': 'clamp(1rem, 0.9rem + 0.4vw, 1.25rem)',
        'xl-fluid': 'clamp(1.25rem, 1.1rem + 0.6vw, 1.5rem)',
        '2xl-fluid': 'clamp(1.5rem, 1.2rem + 1.2vw, 2rem)',
        '3xl-fluid': 'clamp(1.875rem, 1.5rem + 1.5vw, 2.5rem)',
      },
      spacing: {
        // Fluid spacing
        'fluid-xs': 'clamp(0.25rem, 0.2rem + 0.2vw, 0.5rem)',
        'fluid-sm': 'clamp(0.5rem, 0.4rem + 0.3vw, 0.75rem)',
        'fluid': 'clamp(0.75rem, 0.6rem + 0.3vw, 1.25rem)',
        'fluid-lg': 'clamp(1rem, 0.8rem + 0.5vw, 1.5rem)',
        'fluid-xl': 'clamp(1.5rem, 1.2rem + 0.8vw, 2rem)',
      },
      screens: {
        '3xl': '1920px',
        '4xl': '2560px',
      },
      gridTemplateColumns: {
        'auto-fill-280': 'repeat(auto-fill, minmax(280px, 1fr))',
        'auto-fill-320': 'repeat(auto-fill, minmax(320px, 1fr))',
        'auto-fill-360': 'repeat(auto-fill, minmax(360px, 1fr))',
        'auto-fill-400': 'repeat(auto-fill, minmax(400px, 1fr))',
      },
    },
  },
  plugins: [
    // Add custom plugin to support 'light:' variant
    function({ addVariant }) {
      addVariant('light', '.light &')
    }
  ],
} 