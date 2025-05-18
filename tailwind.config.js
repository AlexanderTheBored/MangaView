/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./home.html",
    "./browse.html",
    "./latest.html",
    "./login.html",
    "./test.html",
    "./js/**/*.js" // Optional: if you use Tailwind classes in JavaScript
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Segoe UI'", "Tahoma", "Geneva", "Verdana", "sans-serif"]
      },
      colors: {
        dark: "#1e1e1e",
        accent: "#ff6b6b",
        light: "#f5f5f5",
        muted: "#333",
        cardBg: "#fff",
        cardBack: "#f5f5f5",
        bannerYellow: "#ffdd57",
        paginationBlue: "#007bff",
        paginationHover: "#0056b3",
        noticeBlue: "#cce5ff",
        noticeText: "#004085",
      },
      boxShadow: {
        header: "0 2px 4px rgba(0, 0, 0, 0.2)",
        card: "0 4px 6px rgba(0, 0, 0, 0.1)",
        cardHover: "0 6px 12px rgba(0, 0, 0, 0.15)",
        login: "0 4px 12px rgba(0, 0, 0, 0.1)",
      },
      keyframes: {
        scrollBanner: {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(-100%)" },
        },
      },
      animation: {
        scrollBanner: "scrollBanner 20s linear infinite",
      },
    },
  },
  plugins: [],
};
