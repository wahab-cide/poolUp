/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require("nativewind/preset")],
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        Inter: ["Inter", "sans-serif"],
        InterBold: ["InterBold", "sans-serif"],
        InterMedium: ["InterMedium", "sans-serif"],
        InterSemiBold: ["InterSemiBold", "sans-serif"],
        InterExtraBold: ["InterExtraBold", "sans-serif"],
        InterExtraLight: ["InterExtraLight", "sans-serif"],
        InterLight: ["InterLight", "sans-serif"],
      },
      colors: {
        // Dark Theme Colors (Website-Inspired)
        dark: {
          // Pure black backgrounds like the website
          background: "#000000",
          surface: "#0D0D0D", 
          card: "#161616",
          overlay: "rgba(0, 0, 0, 0.7)",
          
          // Text colors
          'text-primary': "#FFFFFF",
          'text-secondary': "#888787", // Website's exact gray
          'text-muted': "#3B3B3B",
          
          // Brand colors from website
          'brand-blue': "#3B82F6",
          'brand-green': "#10B981",
          'brand-orange': "#F97316",
          'brand-amber': "#F59E0B",
          
          // Glass morphism effects
          'glass-light': "rgba(255, 255, 255, 0.1)",
          'glass-dark': "rgba(0, 0, 0, 0.4)",
          'glass-border': "rgba(255, 255, 255, 0.2)",
          
          // Borders
          border: "rgba(255, 255, 255, 0.1)",
          'border-subtle': "rgba(255, 255, 255, 0.05)",
          
          // Interactive states
          hover: "rgba(255, 255, 255, 0.05)",
          active: "rgba(255, 255, 255, 0.1)",
        },
        bg: {
          page: "#0D0D0D",
          surface: "#161616"
        },
        text: {
          primary: "#FFFFFF",
          secondary: "#B3B3B3"
        },
        overlay: {
          90: "rgba(0,0,0,0.90)",
          60: "rgba(0,0,0,0.60)"
        },
        neutral: {
          200: "#262626",
          700: "#1A1A1A"
        },
        brand: {
          500: "#0A84FF",
          600: "#0070F3",
          700: "#0366D6"
        },
        blue: {
          200: "#152934",
          300: "#1C3847",
          400: "#1E4254",
          500: "#235065",
          600: "#65A1C2",
          700: "#3491B8",
          800: "#0D7FA6",
          900: "#89B2CC",
          1000: "#FFF0EF"
        },
        red: {
          100: "#241A1B",
          200: "#2F2223",
          300: "#3E2D2F",
          400: "#412F31",
          500: "#523A3C",
          600: "#835A59",
          700: "#AF8080",
          800: "#A47372",
          900: "#C3908F",
          1000: "#FFEBE8"
        },
        amber: {
          100: "#251811",
          200: "#2D1D15",
          300: "#432D22",
          400: "#4D3428",
          500: "#614334",
          600: "#D79C7E",
          700: "#F1AF8D",
          800: "#E3A182",
          900: "#E3A182",
          1000: "#FFEADE"
        },
        green: {
          100: "#1F271F",
          200: "#272F24",
          300: "#2D3426",
          400: "#313A27",
          500: "#3F4B2C",
          600: "#54653A",
          700: "#617342",
          800: "#53663C",
          900: "#6F7F47",
          1000: "#F5FDE7"
        },
        teal: {
          100: "#1F2828",
          200: "#242E2E",
          300: "#303C3E",
          400: "#303C3D",
          500: "#3F5053",
          600: "#566B71",
          700: "#597277",
          800: "#4B656B",
          900: "#6B8A92",
          1000: "#F4FCFA"
        },
        purple: {
          100: "#1B1D25",
          200: "#222730",
          300: "#2D3440",
          400: "#363E4C",
          500: "#41475A",
          600: "#5B6277",
          700: "#5B6276",
          800: "#474F61",
          900: "#6E748F",
          1000: "#F4F1FD"
        },
        orange: {
          50: "#FFF7ED",
          100: "#FFEDD5",
          200: "#FED7AA",
          300: "#FDBA74",
          400: "#FB923C",
          500: "#F97316",
          600: "#EA580C",
          700: "#C2410C",
          800: "#9A3412",
          900: "#7C2D12",
          950: "#431407"
        },
        pink: {
          100: "#241B1D",
          200: "#2C2022",
          300: "#37282A",
          400: "#392A2B",
          500: "#463234",
          600: "#664A4A",
          700: "#846060",
          800: "#7B5759",
          900: "#8D696A",
          1000: "#FBEAEB"
        }
      }
    }
  },
  plugins: []
};
