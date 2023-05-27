import fs from "fs";
import path from "path";

import { backup } from "@/libs/backup";
import { grabVersionFromToc } from "@/libs/grab-wa-version";
import sanitize from "@/libs/sanitize";
import { matchFolderNameInsensitive } from "@/libs/utilities";

export async function writeAddonData(config, addonsInstalled, aurasWithData, stash) {
  console.log("writeAddonData");
  const addonConfigs = addonsInstalled;

  if (config.wowpath.validated && config.wowpath.version !== "") {
    const addonPath = ["Interface", "AddOns", "WeakAurasCompanion"];
    let addonFolder = path.join(config.wowpath.value, config.wowpath.version);

    while (addonPath.length) {
      const check = addonPath.shift();
      const folder = matchFolderNameInsensitive(addonFolder, check, addonPath.length === 0);

      if (folder) {
        addonFolder = path.join(addonFolder, folder);
      } else {
        throw new Error("errorCantCreateAddon");
      }
    }
    // Make data.lua
    let LuaOutput = "-- file generated automatically\n";
    LuaOutput += "WeakAurasCompanionData = {\n";
    let addonDepts = "";
    const fields = [
      "name",
      "author",
      "encoded",
      "wagoVersion",
      "wagoSemver",
      "source",
      // "logo" -- keep that for a future WeakAuras release
    ];

    addonConfigs.forEach((config) => {
      addonDepts += config.addonName + ",";

      let spacing = "";

      LuaOutput += `  ${config.addonName} = {\n`;
      spacing = "  ";

      let LuaSlugs = spacing + "  slugs = {\n";

      aurasWithData
        .filter((aura) => aura.auraType === config.addonName)
        .forEach((aura) => {
          LuaSlugs += spacing + `    ["${aura.slug.replace(/"/g, '\\"')}"] = {\n`;

          fields.forEach((field) => {
            if (aura[field]) {
              LuaSlugs += spacing + `      ${field} = [=[${aura[field]}]=],\n`;
            }
          });

          if (typeof aura.changelog !== "undefined" && typeof aura.changelog.text !== "undefined") {
            let sanitized;

            if (aura.changelog.format === "bbcode") {
              sanitized = sanitize.bbcode(aura.changelog.text);
            } else if (aura.changelog.format === "markdown") {
              sanitized = sanitize.markdown(aura.changelog.text);
            }

            LuaSlugs += spacing + `      versionNote = [=[${sanitized}]=],\n`;
          }

          LuaSlugs += spacing + "    },\n";
        });
      LuaOutput += LuaSlugs;
      LuaOutput += spacing + "  },\n";
      LuaOutput += spacing + "  stash = {\n";

      stash.auras
        .filter((aura) => aura.auraType === config.addonName)
        .forEach((aura) => {
          LuaOutput += spacing + `    ["${aura.slug.replace(/"/g, '\\"')}"] = {\n`;

          fields.forEach((field) => {
            if (aura[field]) {
              LuaOutput += spacing + `      ${field} = [=[${aura[field]}]=],\n`;
            }
          });

          if (typeof aura.changelog !== "undefined" && typeof aura.changelog.text !== "undefined") {
            let sanitized;

            if (aura.changelog.format === "bbcode") {
              sanitized = sanitize.bbcode(aura.changelog.text);
            } else if (aura.changelog.format === "markdown") {
              sanitized = sanitize.markdown(aura.changelog.text);
            }

            LuaOutput += spacing + `      versionNote = [=[${sanitized}]=],\n`;
          }

          LuaOutput += spacing + `      source = "${aura.source}",\n`;
          LuaOutput += spacing + "    },\n";
        });

      LuaOutput += spacing + "  },\n";

      if (config.addonName === "WeakAuras") {
        LuaOutput += spacing + "  stopmotionFiles = {\n";
        const stopmotionFilesPath = path.join(addonFolder, "animations");

        if (fs.existsSync(stopmotionFilesPath)) {
          const regex = new RegExp(/^(.*?)(?: GIF)?\.x\d+y\d+f\d+w\d+h\d+W\d+H\d+\.tga$/);

          fs.readdirSync(stopmotionFilesPath)
            .filter((v) => v && v.match(regex))
            .map((v) => ({
              filename: v,
              title: v.match(regex)[1],
            }))
            .forEach((file) => {
              LuaOutput += spacing + `    [ [=[${file.filename}]=] ] = [=[${file.title}]=],\n`;
            });
        }

        LuaOutput += spacing + "  },\n";
      }
      LuaOutput += "  },\n";
    });

    LuaOutput += "}";

    /* if (this.stash.lenghth > 0) { LuaOutput += "" } */
    const tocVersion = grabVersionFromToc(config.wowpath.value, config.wowpath.version);
    console.log("WeakAuras.toc has version:", tocVersion);
    const files = [
      {
        name: "WeakAurasCompanion.toc",
        data: `## Interface: ${tocVersion}
## Title: WeakAuras Companion
## Author: The WeakAuras Team
## Version: ${__APP_VERSION__}
## IconTexture: Interface\\AddOns\\WeakAuras\\Media\\Textures\\icon.blp
## Notes: Keep your WeakAuras updated!
## X-Category: Interface Enhancements
## DefaultState: Enabled
## LoadOnDemand: 0
## OptionalDeps: ${addonDepts}

data.lua
init.lua`,
      },
      {
        name: "WeakAurasCompanion-Classic.toc",
        data: `## Interface: ${tocVersion}
## Title: WeakAuras Companion
## Author: The WeakAuras Team
## Version: ${__APP_VERSION__}
## Notes: Keep your WeakAuras updated!
## X-Category: Interface Enhancements
## DefaultState: Enabled
## LoadOnDemand: 0
## OptionalDeps: ${addonDepts}

data.lua
init.lua`,
      },
      {
        name: "WeakAurasCompanion-Mainline.toc",
        data: `## Interface: ${tocVersion}
## Title: WeakAuras Companion
## Author: The WeakAuras Team
## Version: ${__APP_VERSION__}
## IconTexture: Interface\\AddOns\\WeakAuras\\Media\\Textures\\icon.blp
## Notes: Keep your WeakAuras updated!
## X-Category: Interface Enhancements
## DefaultState: Enabled
## LoadOnDemand: 0
## OptionalDeps: ${addonDepts}

data.lua
init.lua`,
      },
      {
        name: "WeakAurasCompanion-Wrath.toc",
        data: `## Interface: ${tocVersion}
## Title: WeakAuras Companion
## Author: The WeakAuras Team
## Version: ${__APP_VERSION__}
## Notes: Keep your WeakAuras updated!
## X-Category: Interface Enhancements
## DefaultState: Enabled
## LoadOnDemand: 0
## OptionalDeps: ${addonDepts}

data.lua
init.lua`,
      },
      {
        name: "init.lua",
        data: `-- file generated automatically
local loadedFrame = CreateFrame("FRAME")
loadedFrame:RegisterEvent("ADDON_LOADED")
loadedFrame:SetScript("OnEvent", function(_, _, addonName)
  if addonName == "WeakAurasCompanion" then
    if WeakAuras and WeakAuras.AddCompanionData and WeakAurasCompanionData then
      local WeakAurasData = WeakAurasCompanionData.WeakAuras
      if WeakAurasData then
        WeakAuras.AddCompanionData(WeakAurasData)
        WeakAuras.StopMotion.texture_types["WeakAuras Companion"] = WeakAuras.StopMotion.texture_types["WeakAuras Companion"] or {}
        local CompanionTextures = WeakAuras.StopMotion.texture_types["WeakAuras Companion"]
        for fileName, name in pairs(WeakAurasData.stopmotionFiles) do
          CompanionTextures["Interface\\\\AddOns\\\\WeakAurasCompanion\\\\animations\\\\" .. fileName] = name
        end
      end
    end

    if Plater and Plater.AddCompanionData and WeakAurasCompanionData and WeakAurasCompanionData.Plater then
      Plater.AddCompanionData(WeakAurasCompanionData.Plater)
    end
  end
end)
`,
      },
      {
        name: "data.lua",
        data: LuaOutput,
      },
    ];

    files.forEach((file) => {
      const filePath = path.join(addonFolder, file.name);

      fs.writeFile(filePath, file.data, (err2) => {
        if (err2) {
          throw new Error("errorFileSave");
        }
      });
    });
  }
  backup(config, addonsInstalled);
}
