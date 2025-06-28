/** @type {import('tailwindcss').Config} */
export default {
  // Add this line to enable dark mode based on a class
  darkMode: 'class', 
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Add a custom gray shade for better dark mode table rows
      colors: {
        gray: {
          750: '#2a3442', 
        },
      },
    },
  },
  plugins: [],
}
