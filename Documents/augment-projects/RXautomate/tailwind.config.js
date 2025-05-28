/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/providers/**/*.{js,ts,jsx,tsx,mdx}',
    './src/styles/**/*.{js,ts,jsx,tsx,mdx,css}',
  ],
  theme: {
    extend: {
      colors: {
        'nhs-blue': '#005EB8',
        'nhs-dark-blue': '#003087',
        'nhs-bright-blue': '#0072CE',
        'nhs-light-blue': '#41B6E6',
        'nhs-aqua-blue': '#00A9CE',
        'nhs-pale-blue': '#E6F1F9',
        'nhs-black': '#231F20',
        'nhs-dark-grey': '#425563',
        'nhs-mid-grey': '#768692',
        'nhs-pale-grey': '#E8EDEE',
        'nhs-green': '#009639',
        'nhs-light-green': '#78BE20',
        'nhs-aqua-green': '#00A499',
        'nhs-purple': '#330072',
        'nhs-dark-pink': '#7C2855',
        'nhs-pink': '#AE2573',
        'nhs-dark-red': '#8A1538',
        'nhs-red': '#DA291C',
        'nhs-orange': '#ED8B00',
        'nhs-warm-yellow': '#FFB81C',
        'nhs-yellow': '#FAE100',
      },
    },
  },
  plugins: [],
}
