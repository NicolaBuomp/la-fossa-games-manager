/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        ink: "var(--color-brand-contrast)",
        fossa: "var(--color-brand-primary)",
        paper: "#FAF7F2",
        income: "var(--color-semantic-income)",
        expense: "var(--color-semantic-expense)",
      },
      fontFamily: {
        body: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Archivo Black", "Inter", "ui-sans-serif", "system-ui"],
      },
    },
  },
  plugins: [],
};
