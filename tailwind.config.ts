import type { Config } from "tailwindcss"
const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Colores de la Universidad Politécnica de San Luis Potosí
        upslp: {
          50: "#F0F2F7", // Azul casi blanco
          100: "#E6EAF2", // Azul muy claro
          200: "#CCD5E5", // Azul claro
          300: "#99ABCB", // Azul medio claro
          400: "#6681B1", // Azul medio
          500: "#334C7D", // Azul medio oscuro
          600: "#1A2B5F", // Azul principal (del logo)
          700: "#15234D", // Azul oscuro
          800: "#101A3A", // Azul muy oscuro
          900: "#0A1128", // Azul casi negro
        },
        orange: {
          50: "#FFF8F0", // Naranja casi blanco
          100: "#FEF2E6", // Naranja muy claro
          200: "#FCE5CC", // Naranja claro
          300: "#FACB99", // Naranja medio claro
          400: "#F7B166", // Naranja medio
          500: "#F7941D", // Naranja principal (del logo)
          600: "#E67E00", // Naranja oscuro
          700: "#BF6800", // Naranja muy oscuro
          800: "#995300", // Naranja casi marrón
          900: "#663700", // Naranja marrón oscuro
        },
        // Mantener los azules originales para compatibilidad
        blue: {
          100: "#E6EAF2", // Reemplazado por upslp-100
          300: "#99ABCB", // Reemplazado por upslp-300
          600: "#1A2B5F", // Reemplazado por upslp-600
          700: "#15234D", // Reemplazado por upslp-700
          800: "#101A3A", // Reemplazado por upslp-800
          900: "#0A1128", // Reemplazado por upslp-900
        },
        // Reemplazar púrpura por naranja
        purple: {
          600: "#F7941D", // Reemplazado por orange-500
          700: "#E67E00", // Reemplazado por orange-600
        },
        borderRadius: {
          lg: "var(--radius)",
          md: "calc(var(--radius) - 2px)",
          sm: "calc(var(--radius) - 4px)",
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
export default config
