import postcssNesting from 'postcss-nesting';

/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    'tailwindcss/nesting': postcssNesting,
    tailwindcss: {},
  }
}
export default config;
