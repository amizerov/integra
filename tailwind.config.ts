import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '480px',   // 3 карточки
        '3xl': '1920px', // 8 карточек
      },
      keyframes: {
        'logo-glow': {
          '0%, 100%': { 
            transform: 'scale(1)',
            opacity: '0.3',
          },
          '50%': { 
            transform: 'scale(1.2)',
            opacity: '0.7',
          },
        },
        'sparkle': {
          '0%, 100%': { opacity: '0' },
          '50%': { opacity: '1' },
        },
        'twinkle-1': {
          '0%, 100%': { 
            opacity: '0',
            transform: 'scale(0.5) rotate(0deg)',
          },
          '50%': { 
            opacity: '1',
            transform: 'scale(1) rotate(180deg)',
          },
        },
        'twinkle-2': {
          '0%, 100%': { 
            opacity: '0',
            transform: 'scale(0.5) rotate(0deg)',
          },
          '33%': { 
            opacity: '1',
            transform: 'scale(1) rotate(180deg)',
          },
        },
      },
      animation: {
        'logo-glow': 'logo-glow 3s ease-in-out infinite',
        'sparkle': 'sparkle 2s ease-in-out infinite',
        'twinkle-1': 'twinkle-1 2s ease-in-out infinite',
        'twinkle-2': 'twinkle-2 2.5s ease-in-out infinite 0.5s',
      },
    },
  },
};

export default config;
