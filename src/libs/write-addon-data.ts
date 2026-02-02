import fs from "node:fs";
import path from "node:path";
import { backup } from "@/libs/backup";
import { grabVersionFromToc } from "@/libs/grab-wa-version";
import sanitize from "@/libs/sanitize";
import { matchFolderNameInsensitive } from "@/libs/utilities";
import type { StashStore } from "@/stores/auras";
import type { AddonConfig, AuraType, ConfigState } from "@/stores/config";

export function writeAddonData(
  config: ConfigState,
  addonsInstalled: AddonConfig[],
  aurasWithData: any[],
  stash: StashStore,
) {
  console.log("writeAddonData");
  const addonConfigs = addonsInstalled;

  if (config.wowpath.validated && config.wowpath.version !== "") {
    const addonPath = ["Interface", "AddOns", "WeakAurasCompanion"];
    let addonFolder = path.join(config.wowpath.value, config.wowpath.version);

    while (addonPath.length) {
      const check = addonPath.shift();
      const folder = matchFolderNameInsensitive(addonFolder, check, true);

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

    addonConfigs.forEach((config: { addonName: string }, index: number) => {
      addonDepts += `${config.addonName}`;

      if (index < addonConfigs.length - 1) {
        addonDepts += ", ";
      }

      let spacing = "";

      LuaOutput += `  ${config.addonName} = {\n`;
      spacing = "  ";

      let LuaSlugs = `${spacing}  slugs = {\n`;

      aurasWithData
        .filter((aura: AuraType) => aura.auraType === config.addonName)
        .forEach((aura: AuraType) => {
          LuaSlugs += `${spacing}    ["${aura.slug.replace(
            /"/g,
            '\\"',
          )}"] = {\n`;

          fields.forEach((field) => {
            if (aura[field]) {
              LuaSlugs += `${spacing}      ${field} = [=[${aura[field]}]=],\n`;
            }
          });

          if (
            typeof aura.changelog !== "undefined" &&
            typeof aura.changelog.text !== "undefined"
          ) {
            let sanitized;

            if (aura.changelog.format === "bbcode") {
              sanitized = sanitize.bbcode(aura.changelog.text);
            } else if (aura.changelog.format === "markdown") {
              sanitized = sanitize.markdown(aura.changelog.text);
            }

            LuaSlugs += `${spacing}      versionNote = [=[${sanitized}]=],\n`;
          }

          LuaSlugs += `${spacing}    },\n`;
        });
      LuaOutput += LuaSlugs;
      LuaOutput += `${spacing}  },\n`;
      LuaOutput += `${spacing}  stash = {\n`;

      stash.auras
        .filter((aura) => aura.auraType === config.addonName)
        .forEach((aura) => {
          LuaOutput += `${spacing}    ["${aura.slug.replace(
            /"/g,
            '\\"',
          )}"] = {\n`;

          fields.forEach((field) => {
            if (aura[field]) {
              LuaOutput += `${spacing}      ${field} = [=[${aura[field]}]=],\n`;
            }
          });

          if (
            typeof aura.changelog !== "undefined" &&
            typeof aura.changelog.text !== "undefined"
          ) {
            let sanitized: string;

            if (aura.changelog.format === "bbcode") {
              sanitized = sanitize.bbcode(aura.changelog.text);
            } else if (aura.changelog.format === "markdown") {
              sanitized = sanitize.markdown(aura.changelog.text);
            }

            LuaOutput += `${spacing}      versionNote = [=[${sanitized}]=],\n`;
          }

          LuaOutput += `${spacing}      source = "${aura.source}",\n`;
          LuaOutput += `${spacing}    },\n`;
        });

      LuaOutput += `${spacing}  },\n`;

      if (config.addonName === "WeakAuras") {
        LuaOutput += `${spacing}  stopmotionFiles = {\n`;
        const stopmotionFilesPath = path.join(addonFolder, "animations");

        if (fs.existsSync(stopmotionFilesPath)) {
          const regex = /^(.*?)(?: GIF)?\.x\d+y\d+f\d+w\d+h\d+W\d+H\d+\.tga$/;

          fs.readdirSync(stopmotionFilesPath)
            .filter((v) => v?.match(regex))
            .map((v) => ({
              filename: v,
              title: v.match(regex)[1],
            }))
            .forEach((file) => {
              LuaOutput += `${spacing}    [ [=[${file.filename}]=] ] = [=[${file.title}]=],\n`;
            });
        }

        LuaOutput += `${spacing}  },\n`;
      }
      LuaOutput += "  },\n";
    });

    LuaOutput += "}";

    /* if (this.stash.lenghth > 0) { LuaOutput += "" } */
    // Get TOC version from any installed addon (prefer WeakAuras, fallback to Plater or default)
    let tocVersion: string | number = 100207; // Default fallback
    let tocSource = "default";

    // Try to get version from WeakAuras first
    const weakAurasInstalled = addonConfigs.some(
      (config) => config.addonName === "WeakAuras",
    );
    if (weakAurasInstalled) {
      try {
        tocVersion = grabVersionFromToc(
          config.wowpath.value,
          config.wowpath.version,
          "WeakAuras",
        );
        tocSource = "WeakAuras";
      } catch (err) {
        console.log("Could not read WeakAuras.toc:", err);
      }
    }

    // If WeakAuras not installed or failed, try Plater
    if (tocSource === "default") {
      const platerInstalled = addonConfigs.some(
        (config) => config.addonName === "Plater",
      );
      if (platerInstalled) {
        try {
          tocVersion = grabVersionFromToc(
            config.wowpath.value,
            config.wowpath.version,
            "Plater",
          );
          tocSource = "Plater";
        } catch (err) {
          console.log("Could not read Plater.toc:", err);
        }
      }
    }

    console.log(`TOC version ${tocVersion} from ${tocSource}`);

    // Build dependencies list - first addon in addonConfigs is the primary dependency
    const primaryDependency = addonConfigs[0]?.addonName || "WeakAuras";
    const optionalDeps = addonConfigs
      .slice(1)
      .map((config) => config.addonName)
      .concat(addonDepts ? [addonDepts] : [])
      .filter((dep) => dep)
      .join(", ");

    const templateData = `## Interface: ${tocVersion}
## Title: WeakAuras Companion
## Author: The WeakAuras Team
## Version: ${__APP_VERSION__}
## IconTexture: Interface\\AddOns\\WeakAuras\\Media\\Textures\\icon.blp
## Notes: Keep your WeakAuras updated!
## X-Category: Interface Enhancements
## DefaultState: Enabled
## LoadOnDemand: 0
## Dependencies: ${primaryDependency}
## OptionalDeps: ${optionalDeps}

data.lua
init.lua`;

    const fileNames = [
      "WeakAurasCompanion.toc",
      "WeakAurasCompanion-Vanilla.toc",
      "WeakAurasCompanion-Mainline.toc",
      "WeakAurasCompanion-Cata.toc",
      "WeakAurasCompanion-Mists.toc",
      "data.lua",
    ];

    fileNames.forEach((fileName) => {
      const fileData = fileName === "data.lua" ? LuaOutput : templateData;
      const filePath = path.join(addonFolder, fileName);

      fs.writeFile(filePath, fileData, (err) => {
        if (err) {
          throw new Error("errorFileSave");
        }
      });
    });

    const initTemplateData = `-- file generated automatically
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
`;

    const filePath = path.join(addonFolder, "init.lua");

    fs.writeFile(filePath, initTemplateData, (err) => {
      if (err) {
        throw new Error("errorFileSave");
      }
    });
  }
  backup(config, addonsInstalled);
}
