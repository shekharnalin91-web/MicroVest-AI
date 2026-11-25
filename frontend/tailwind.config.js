
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: "#101827",
        charcoal: "#171F2E",
        emerald: "#10B981",
        mint: "#A7F3D0",
        slate: "#1E293B",
      },
    },
  },
  plugins: [],
};
