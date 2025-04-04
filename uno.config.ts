import type { IconSet } from "@iconify/tools";
import { importDirectory, runSVGO } from "@iconify/tools";
import type { CustomIconLoader } from "@iconify/utils/lib/loader/types";
import presetWebFonts from "@unocss/preset-web-fonts";
import { defineConfig, presetIcons, presetUno } from "unocss";

/**
 * Load custom icon set
 */
function loadCustomIconSet(): CustomIconLoader {
  const promise = new Promise<IconSet>((resolve, reject) => {
    void importDirectory("src/assets/social-icons", {
      prefix: "social",
    }).then((iconSet) => {
      iconSet
        .forEach((name) => {
          const svg = iconSet.toSVG(name);

          // Optimise
          runSVGO(svg);

          // Update icon in icon set
          iconSet.fromSVG(name, svg);
        })
        .then(() => {
          resolve(iconSet);
        })
        .catch((err) => {
          reject(new Error(String(err)));
        });
    });
  });

  return async (name) => {
    const iconSet = await promise;
    return iconSet.toSVG(name)?.toMinifiedString();
  };
}

/**
 * Create UnoCSS config
 */
export function createConfig({ dev = true } = {}) {
  return defineConfig({
    envMode: dev ? "dev" : "build",
    theme: {
      fontFamily: {
        sans: "'Montserrat', sans-serif",
      },
      colors: {
        brand: {
          primary: "#131313",
          green: "rgb(18, 173, 18)",
          greyDark: "#2c2c2c",
          greyDarker: "#1a1a1a",
          greyDarkest: "#0d0d0d",
          greyLightest: "#eeeeee",
          accent: "rgb(255, 209, 0)",
        },
        status: {
          pulse: "rgba(102, 255, 0, 1)",
          issue: "#ff3333",
          ok: "#51ae42",
          failure: "#f44336",
        },
      },
    },
    shortcuts: {
      "btn-issue": "text-status-issue border-status-issue hover:bg-white",
    },
    presets: [
      presetIcons({
        autoInstall: false,
        collections: {
          social: loadCustomIconSet(),
          mdi: () =>
            import("@iconify-json/mdi/icons.json").then((i) => i.default),
          fa6brands: () =>
            import("@iconify-json/fa6-brands/icons.json").then(
              (i) => i.default,
            ),
        },
        extraProperties: {
          "display": "inline-block",
          "vertical-align": "top",
        },
      }),
      presetWebFonts({
        provider: "google",
        fonts: {
          sans: ["Montserrat"],
        },
      }),
      presetUno(),
    ],
    safelist: [
      "i-fa6-brands-discord",
      "i-fa6-brands-bluesky",
      "i-fa6-brands-patreon",
      "i-fa6-brands-github",
      "i-fa6-brands-youtube",
      "i-fa6-brands-bluesky",
    ],
  });
}

export default createConfig();
