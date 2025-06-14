/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}", // 👈 importante incluir jsx
  ],
  theme: {
    extend: {
      colors: {
        "mali-pink": "#DC358B",
        "mali-blue": "#007BFF",
      },
      borderRadius: {
        "xl": "1rem",
        "2xl": "1.5rem",
      },
      fontFamily: {
      sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        "card": "0 4px 12px rgba(0, 0, 0, 0.1)",
      }
    },
  },
  plugins: [],
}
