import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#F8FAFC',
        'secondary-bg': '#F1F5F9',
        'card-bg': '#FFFFFF',
        'card-border': '#E2E8F0',
        accent: '#4e67eb',
        'accent-hover': '#3b51c9',
        'text-primary': '#0F172A',
        'text-body': '#334155',
        'text-muted': '#64748B',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
