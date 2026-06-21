import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'psx-bg': '#070B14',
        'psx-card': '#111827',
        'psx-cyan': '#00D4FF',
        'psx-green': '#00E676',
        'psx-red': '#FF3D57',
        'psx-gold': '#FFB800',
        'psx-purple': '#7C3AED',
        'psx-border': 'rgba(255,255,255,0.07)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Space Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'gradient-psx': 'linear-gradient(135deg, #00D4FF 0%, #7C3AED 100%)',
        'gradient-green': 'linear-gradient(135deg, #00E676 0%, #00D4FF 100%)',
        'gradient-card': 'linear-gradient(135deg, rgba(0,212,255,0.08) 0%, rgba(124,58,237,0.05) 100%)',
      },
      animation: {
        'ticker': 'ticker-scroll 120s linear infinite',
        'pulse-glow': 'pulse 2s ease-in-out infinite',
        'fade-up': 'fade-in-up 0.4s ease forwards',
        'shimmer': 'shimmer 1.5s infinite',
      },
      keyframes: {
        'ticker-scroll': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'fade-in-up': {
          'from': { opacity: '0', transform: 'translateY(12px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
      screens: {
        'xs': '375px',
        'sm': '390px',
        'md': '480px',
      },
      maxWidth: {
        'mobile': '480px',
      },
    },
  },
  plugins: [],
};

export default config;
