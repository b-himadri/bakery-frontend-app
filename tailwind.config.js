// tailwind.config.js
const { fontFamily } = require('tailwindcss/defaultTheme'); // Import Tailwind's default font families

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}', // Catches all files in src
    // './src/pages/**/*.{js,ts,jsx,tsx,mdx}', // More specific, adjust as needed
    // './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    // './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        // Define your custom font families
        // Set Poppins as the default 'sans' font
        sans: ['var(--font-poppins)', ...fontFamily.sans],
        
        // Define Cedarville Cursive for specific use
        cedarville: ['var(--font-cedarville)', 'cursive'],

        // Define Geist fonts (if you use them specifically with Tailwind classes like font-geist-sans)
        'geist-sans': ['var(--font-geist-sans)', ...fontFamily.sans],
        'geist-mono': ['var(--font-geist-mono)', ...fontFamily.mono], // Assuming Geist Mono is monospace
      },
    },
  },
  plugins: [],
};