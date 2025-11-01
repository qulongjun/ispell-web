/*
 * @Date: 2025-10-25 23:51:47
 * @LastEditTime: 2025-11-01 17:16:01
 * @Description:
 */
import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './contexts/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './hooks/**/*.{js,ts,jsx,tsx,mdx}',
  ],

  theme: {
    extend: {
      fontFamily: {
        sans: [
          'var(--font-inter)',
          '"PingFang SC"',
          '"Microsoft YaHei"',
          '"Noto Sans CJK SC"',
          ...defaultTheme.fontFamily.sans,
        ],
        mono: [
          'var(--font-jetbrains-mono)',
          '"PingFang SC"',
          '"Microsoft YaHei"',
          '"Noto Sans CJK SC"',
          ...defaultTheme.fontFamily.mono,
        ],
      },
    },
  },
  plugins: [],
};

export default config;
