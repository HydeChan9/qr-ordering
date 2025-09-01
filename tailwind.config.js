// postcss.config.js
export default {
  plugins: {
    "@tailwindcss/postcss": {}, // ✅ 不要再寫 tailwindcss
    autoprefixer: {},
  },
};
