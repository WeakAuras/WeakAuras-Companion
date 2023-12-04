import { defineConfig } from "unocss";
import presetWebFonts from "@unocss/preset-web-fonts";
import presetUno from "@unocss/preset-uno";

export default defineConfig({
  presets: [
    presetUno(),
    presetWebFonts({
      provider: "google",
      fonts: {
        sans: ["Montserrat"],
      },
    }),
  ],
  theme: {
    colors: {
      brand: {
        primary: "#131313",
        accent: "rgb(255, 209, 0)",
      },
    },
  },
});
