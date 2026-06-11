/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        mint: "#2DD4A8",
        coral: "#FF6B52",
        rose: "#F43F5E",
        sky: "#38BDF8",
      },
      fontFamily: {
        jakarta: ["PlusJakartaSans_700Bold", "PlusJakartaSans_600SemiBold", "PlusJakartaSans_500Medium", "PlusJakartaSans_400Regular"],
        "jakarta-bold": ["PlusJakartaSans_700Bold"],
        "jakarta-semibold": ["PlusJakartaSans_600SemiBold"],
        "jakarta-medium": ["PlusJakartaSans_500Medium"],
        "jakarta-regular": ["PlusJakartaSans_400Regular"],
      },
    },
  },
  plugins: [],
};
