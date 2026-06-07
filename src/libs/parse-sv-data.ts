import { reactive } from "vue";
import type { AddonConfig } from "@/stores/config";

interface ParsedAuraFields {
  auraTypeDisplay: string | null;
  id: number;
  ignoreWagoUpdate: boolean;
  semver: string;
  slug: string;
  uid?: string | null;
  uids?: string[];
  version: number;
}

function findSlugAndMatchURL(url, pattern: RegExp) {
  const result = url.match(pattern);

  if (result) {
    return result[2];
  }
  return null;
}

function createFoundAura(config: AddonConfig, fields: ParsedAuraFields) {
  const { uid, uids, ...auraFields } = fields;

  return reactive({
    ...auraFields,
    ...(uid !== undefined ? { uid } : {}),
    wagoVersion: null,
    wagoSemver: null,
    changelog: null,
    created: null,
    modified: null,
    author: null,
    encoded: null,
    wagoid: null,
    ids: [fields.id],
    uids: uids ?? (uid ? [uid] : []),
    regionType: null,
    auraType: config.addonName,
    addonConfig: config,
  });
}

export function parseWeakAurasSVdata(WeakAurasSavedData, config: AddonConfig) {
  const aurasFromFile = [];

  if (WeakAurasSavedData.body[0].variables[0].name !== "WeakAurasSaved") {
    return [];
  }

  const pattern = /(https:\/\/wago.io\/)([^/]+)/;

  WeakAurasSavedData.body[0].init[0].fields.forEach((obj) => {
    if (obj.key.value === "displays") {
      obj.value.fields.forEach((obj2) => {
        let slug: string;
        let url: URL;
        let version = 0;
        let semver: string;
        let ignoreWagoUpdate = false;
        let id: number;
        let uid = null;

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
          const foundAura = createFoundAura(config, {
            id,
            uid,
            slug,
            version,
            semver,
            ignoreWagoUpdate,
            auraTypeDisplay: null,
          });

          aurasFromFile.push(foundAura);
        }
      });
    }
  });

  return aurasFromFile;
}

export function parsePlaterSVdata(PlaterSavedData, config: AddonConfig) {
  const aurasFromFile = [];

  if (PlaterSavedData.body[0].variables[0].name !== "PlaterDB") {
    return;
  }

  const pattern = /(https:\/\/wago.io\/)([^/]+)/;

  PlaterSavedData.body[0].init[0].fields.forEach((obj) => {
    if (obj.key.value === "profiles") {
      obj.value.fields.forEach((profile) => {
        let profslug: string;
        let profurl: URL;
        let profversion = 0;
        let profsemver: string;
        let profignoreWagoUpdate = false;
        let profid: number;

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
              let slug: string;
              let url: URL;
              let version = 0;
              let semver: string;
              let ignoreWagoUpdate = false;
              let id: number;

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
                const foundAura = createFoundAura(config, {
                  id,
                  slug,
                  version,
                  semver,
                  ignoreWagoUpdate,
                  uids: [],
                  auraTypeDisplay: config.addonName + typeSuffix,
                });

                aurasFromFile.push(foundAura);
              }
            });
          }
        });

        if (profslug) {
          const foundAura = createFoundAura(config, {
            id: profid,
            slug: profslug,
            version: profversion,
            semver: profsemver,
            ignoreWagoUpdate: profignoreWagoUpdate,
            uids: [],
            auraTypeDisplay: `${config.addonName}-Profile`,
          });

          aurasFromFile.push(foundAura);
        }
      });
    }
  });

  return aurasFromFile;
}
