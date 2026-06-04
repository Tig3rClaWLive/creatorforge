import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      boxShadow: { glow: '0 0 60px rgba(249,115,22,.25)' }
    }
  },
  plugins: []
};
export default config;
