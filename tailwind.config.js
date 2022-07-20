const plugin = require('tailwindcss/plugin');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        silver: 'silver',
      },
    },
  },
  plugins: [
    plugin(function ({ addComponents }) {
      addComponents({
        '.btn': {
          'padding': '.5rem 1rem',
          'borderRadius': '.25rem',
          'fontWeight': '600',
          '&:hover': {
            backgroundColor: '#ddd',
          },
          '&:focus': {
            backgroundColor: '#ddd',
          },
          '&:active': {
            backgroundColor: '#ccc',
          },
          'outline': 'none',
        },
        '.btn-large': {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          marginTop: '1.25rem',
          marginBottom: '1.25rem',
        },
        '.btn-blue': {
          'backgroundColor': '#0d6efd',
          'color': '#fff',
          '&:hover': {
            backgroundColor: '#0b5ed7',
          },
          '&:focus': {
            backgroundColor: '#0b5ed7',
          },
          '&:active': {
            backgroundColor: '#0a58ca',
          },
        },
      });
    }),
  ],
};
