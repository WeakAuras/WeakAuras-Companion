import type { AddonConfig } from "@/stores/config";
import { reactive } from "vue";

function findSlugAndMatchURL(url: string, pattern: RegExp): string | null { // Added explicit type annotations
  const result = url.match(pattern);

  if (result) {
    return result[2];
  }
  return null;
}

export function parseWeakAurasSVdata(WeakAurasSavedData: any, config: AddonConfig): any[] { // Added explicit type annotations
  if (!WeakAurasSavedData || !config) return []; // Added null checks

  const aurasFromFile = [];

  if (WeakAurasSavedData.body[0].variables[0].name !== "WeakAurasSaved") {
    return [];
  }

  const pattern = /(https:\/\/wago.io\/)([^/]+)/;

  WeakAurasSavedData.body[0].init[0].fields.forEach((obj) => {
    if (obj.key.value === "displays") {
      obj.value.fields.forEach((obj2) => {
        let slug: string | null = null; // Initialized as null
        let url: string | null = null; // Initialized as null
        let version = 0;
        let semver: string | null = null; // Initialized as null
        let ignoreWagoUpdate = false;
        let id: number | null = null; // Initialized as null
        let uid: string | null = null; // Initialized as null

        obj2.value.fields.forEach((obj3) => {
          if (!obj3.key) {
            return;
          }

          const { key, value } = obj3;
          const keyVal = key.value;

          if (keyVal === "id") {
            id = value.value;
          }

          if (keyVal === "uid") {
            uid = value.value;
          }

          if (keyVal === "version") {
            version = Number(value.value);
          }

          if (keyVal === "semver") {
            semver = value.value;
          }

          if (keyVal === "ignoreWagoUpdate") {
            ignoreWagoUpdate = value.value;
          }

          if (keyVal === "url") {
            url = value.value;
            slug = findSlugAndMatchURL(url, pattern);
          }
        });

        if (slug) {
          const foundAura = reactive({
            id,
            uid,
            slug,
            version,
            semver,
            ignoreWagoUpdate,
            wagoVersion: null,
            wagoSemver: null,
            changelog: null,
            created: null,
            modified: null,
            author: null,
            encoded: null,
            wagoid: null,
            ids: [id],
            uids: uid ? [uid] : [],
            regionType: null,
            auraType: config.addonName,
            auraTypeDisplay: null,
            addonConfig: config,
          });

          aurasFromFile.push(foundAura);
        }
      });
    }
  });

  return aurasFromFile;
}

export function parsePlaterSVdata(PlaterSavedData: any, config: AddonConfig): any[] { // Added explicit type annotations
  if (!PlaterSavedData || !config) return []; // Added null checks

  const aurasFromFile = [];

  if (PlaterSavedData.body[0].variables[0].name !== "PlaterDB") {
    return [];
  }

  const pattern = /(https:\/\/wago.io\/)([^/]+)/;

  PlaterSavedData.body[0].init[0].fields.forEach((obj) => {
    if (obj.key.value === "profiles") {
      obj.value.fields.forEach((profile) => {
        let profslug: string | null = null; // Initialized as null
        let profurl: string | null = null; // Initialized as null
        let profversion = 0;
        let profsemver: string | null = null; // Initialized as null
        let profignoreWagoUpdate = false;
        let profid: number | null = null; // Initialized as null

        profile.value.fields.forEach((profData) => {
          if (!profData.key) {
            return;
          }

          const { key, value } = profData;
          const keyVal = key.value;

          if (keyVal === "Name") {
            profid = value.value;
          }

          if (keyVal === "version") {
            profversion = Number(value.value);
          }

          if (keyVal === "semver") {
            profsemver = value.value;
          }

          if (keyVal === "ignoreWagoUpdate") {
            profignoreWagoUpdate = value.value;
          }

          if (keyVal === "url") {
            profurl = value.value;
            profslug = findSlugAndMatchURL(profurl, pattern);
          }

          if (keyVal === "script_data" || keyVal === "hook_data") {
            const typeSuffix =
              (keyVal === "hook_data" && "-Mod") ||
              (keyVal === "script_data" && "-Script") ||
              "";

            value.fields.forEach((obj2) => {
              let slug: string | null = null; // Initialized as null
              let url: string | null = null; // Initialized as null
              let version = 0;
              let semver: string | null = null; // Initialized as null
              let ignoreWagoUpdate = false;
              let id: number | null = null; // Initialized as null

              obj2.value.fields.forEach((obj3) => {
                if (!obj3.key) {
                  return;
                }

                const { key, value } = obj3;
                const keyVal = key.value;

                if (keyVal === "Name") {
                  id = value.value;
                }

                if (keyVal === "version") {
                  version = Number(value.value);
                }

                if (keyVal === "semver") {
                  semver = value.value;
                }

                if (keyVal === "ignoreWagoUpdate") {
                  ignoreWagoUpdate = value.value;
                }

                if (keyVal === "url") {
                  url = value.value;
                  slug = findSlugAndMatchURL(url, pattern);
                }
              });

              if (slug) {
                const foundAura = reactive({
                  id,
                  slug,
                  version,
                  semver,
                  ignoreWagoUpdate,
                  wagoVersion: null,
                  wagoSemver: null,
                  changelog: null,
                  created: null,
                  modified: null,
                  author: null,
                  encoded: null,
                  wagoid: null,
                  ids: [id],
                  uids: [],
                  regionType: null,
                  auraType: config.addonName,
                  auraTypeDisplay: config.addonName + typeSuffix,
                  addonConfig: config,
                });

                aurasFromFile.push(foundAura);
              }
            });
          }
        });

        if (profslug) {
          const foundAura = reactive({
            id: profid,
            slug: profslug,
            version: profversion,
            semver: profsemver,
            ignoreWagoUpdate: profignoreWagoUpdate,
            wagoVersion: null,
            wagoSemver: null,
            changelog: null,
            created: null,
            modified: null,
            author: null,
            encoded: null,
            wagoid: null,
            ids: [profid],
            uids: [],
            regionType: null,
            auraType: config.addonName,
            auraTypeDisplay: `${config.addonName}-Profile`,
            addonConfig: config,
          });

          aurasFromFile.push(foundAura);
        }
      });
    }
  });

  return aurasFromFile;
}
