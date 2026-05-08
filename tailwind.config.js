/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        ink: "#0A0A0A",
        fossa: "#FFD400",
        paper: "#FAF7F2",
        income: "#10B981",
        expense: "#FF3D00"
      },
      fontFamily: {
        body: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Archivo Black", "Inter", "ui-sans-serif", "system-ui"]
      }
    }
  },
  plugins: []
};
