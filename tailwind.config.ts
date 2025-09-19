import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef9ff",
          100: "#d6f1ff",
          200: "#aee1ff",
          300: "#7ccaff",
          400: "#49abff",
          500: "#1f85ff",
          600: "#1066db",
          700: "#0b4fb0",
          800: "#0c458e",
          900: "#0f3b73",
        }
      }
    },
  },
  plugins: [],
};
export default config;
