/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}", "./*.jsx"],
  theme: {
    extend: {
      colors: {
        bg: '#D2E5D8',           // Light sage green background
        surface: '#E5EFE9',      // Slightly lighter sage green card background
        'surface-light': '#F4F8F6', // Clean light sage/white for inputs and highlights
        gold: {
          DEFAULT: '#1B3626',    // Dark forest green text and borders
          light: '#2D543B',      // Slightly lighter forest green
          dim: '#5C7C68',        // Muted sage-forest green for secondary text
        },
        forest: '#4A7C59',
      },
      fontFamily: {
        sans: ["DM Sans", "ui-sans-serif", "system-ui"],
        serif: ["Playfair Display", "ui-serif", "Georgia"],
        accent: ["Cormorant Garamond", "ui-serif", "Georgia"],
      },
    },
  },
  plugins: [],
};
