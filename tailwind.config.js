/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{html,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        'main':         '#F4FAFA',
        'accent':       '#75C6C3',
        'accent-light': '#CEEBEA',
        'light':        '#F4FAFA',
        'dark':         '#3E7F7D'
      }
    }
  },
  plugins: []
}
