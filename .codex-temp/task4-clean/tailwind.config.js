/** @type {import('tailwindcss').Config} */

/** Цвета — только var(--color-*); hex задаются в src/index.css (SSOT). */

export default {

  content: [
    "./src/app/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],

  theme: {

    colors: {

      transparent: "transparent",

      current: "currentColor",

      background: "var(--color-background)",

      foreground: "var(--color-foreground)",

      primary: "var(--color-primary)",

      "primary-foreground": "var(--color-primary-foreground)",

      secondary: "var(--color-secondary)",

      "secondary-foreground": "var(--color-secondary-foreground)",

      muted: "var(--color-muted)",

      surface: "var(--color-surface)",

      "surface-muted": "var(--color-surface-muted)",

      "surface-strong": "var(--color-surface-strong)",

      "on-surface-strong": "var(--color-on-surface-strong)",

      border: "var(--color-border)",

      "border-strong": "var(--color-border-strong)",

      "border-dashed": "var(--color-border-dashed)",

      "text-subtle": "var(--color-text-subtle)",

      "on-primary": "var(--color-on-primary)",

      ring: "var(--color-ring)",

      accent: "var(--color-accent)",

      "accent-foreground": "var(--color-accent-foreground)",

      destructive: "var(--color-destructive)",

      "destructive-foreground": "var(--color-destructive-foreground)",

      input: "var(--color-input)",

      card: "var(--color-card)",

      "card-foreground": "var(--color-card-foreground)",

      bizon: {

        black: "var(--bizon-black)",

        white: "var(--bizon-white)",

        light: "var(--bizon-light)",

        light2: "var(--bizon-light-2)",

        gray: "var(--bizon-gray)",

        dark: "var(--bizon-dark)",

        accent: "var(--bizon-accent)",

        accentDark: "var(--bizon-accent-dark)",

      },

    },

    borderColor: ({ theme }) => theme("colors"),

    borderRadius: {

      DEFAULT: "var(--radius)",

      sm: "calc(var(--radius) - 4px)",

      md: "calc(var(--radius) - 2px)",

      lg: "var(--radius)",

      xl: "calc(var(--radius) + 4px)",

      "2xl": "calc(var(--radius) + 8px)",

      "3xl": "calc(var(--radius) + 12px)",

      "4xl": "calc(var(--radius) + 16px)",

    },

    fontFamily: {

      sans: ["var(--font-sans)"],

    },

  },

  plugins: [],

};


