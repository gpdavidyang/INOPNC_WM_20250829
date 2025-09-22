/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {
      // Disable aggressive optimizations
      flexbox: 'no-2009',
      grid: false,
    },
    // CRITICAL: NO CSS minification or optimization
    // cssnano completely removed to maintain quality
  },
};

export default config;