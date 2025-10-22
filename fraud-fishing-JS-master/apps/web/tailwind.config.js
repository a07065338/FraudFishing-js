/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#00B5BC", // Turquesa
        dark: "#00204D",    // Azul oscuro
      },
    },
  },
  plugins: [],
};
