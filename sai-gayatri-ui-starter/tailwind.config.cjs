module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0F6B63',
        'primary-dark': '#0B4F47',
        'mint-light': '#E9FFF8'
      },
      borderRadius: {
        card: '12px'
      }
    }
  },
  plugins: []
}
