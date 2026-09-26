import type { Config } from "tailwindcss";
import { nextui } from "@nextui-org/react";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0B0D11",
        surface: "#161922",
        primary: {
          DEFAULT: "#0F62FE",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#8A3FFC",
          foreground: "#FFFFFF",
        },
      },
    },
  },
  darkMode: "class",
  plugins: [
    nextui({
      defaultTheme: "dark",
      themes: {
        dark: {
          colors: {
            background: "#0B0D11",
            foreground: "#ECEDEE",
            primary: {
              DEFAULT: "#0F62FE",
              foreground: "#FFFFFF",
            },
            secondary: {
              DEFAULT: "#8A3FFC",
              foreground: "#FFFFFF",
            },
          },
        },
      },
    }),
  ],
};

export default config;
