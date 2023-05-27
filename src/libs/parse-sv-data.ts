import { reactive } from "vue";

export function parseWeakAurasSVdata(WeakAurasSavedData, config) {
  const aurasFromFile = [];

  if (WeakAurasSavedData.body[0].variables[0].name !== "WeakAurasSaved") {
    return [];
  }

  const pattern = /(https:\/\/wago.io\/)([^/]+)/;

  WeakAurasSavedData.body[0].init[0].fields.forEach((obj) => {
    if (obj.key.value === "displays") {
      obj.value.fields.forEach((obj2) => {
        let slug;
        let url;
        let version = 0;
        let semver;
        let ignoreWagoUpdate = false;
        let id;
        let uid = null;

        obj2.value.fields.forEach((obj3) => {
          if (obj3.key === undefined) {
            return;
          }

          if (obj3.key.value === "id") {
            id = obj3.value.value;
          }

          if (obj3.key.value === "uid") {
            uid = obj3.value.value;
          }

          if (obj3.key.value === "version") {
            version = Number(obj3.value.value);
          }

          if (obj3.key.value === "semver") {
            semver = obj3.value.value;
          }

          if (obj3.key.value === "ignoreWagoUpdate") {
            ignoreWagoUpdate = obj3.value.value;
          }

          if (obj3.key.value === "url") {
            url = obj3.value.value;
            const result = url.match(pattern);

            if (result) {
              ({ 2: slug } = url.match(pattern));
            }
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

export function parsePlaterSVdata(PlaterSavedData, config) {
  const aurasFromFile = [];

  if (PlaterSavedData.body[0].variables[0].name !== "PlaterDB") {
    return;
  }

  const pattern = /(https:\/\/wago.io\/)([^/]+)/;

  PlaterSavedData.body[0].init[0].fields.forEach((obj) => {
    if (obj.key.value === "profiles") {
      obj.value.fields.forEach((profile) => {
        let profslug;
        let profurl;
        let profversion = 0;
        let profsemver;
        let profignoreWagoUpdate = false;
        let profid;

        profile.value.fields.forEach((profData) => {
          if (profData.key === undefined) {
            return;
          }

          if (profData.key.value === "Name") {
            profid = profData.value.value;
          }

          if (profData.key.value === "version") {
            profversion = Number(profData.value.value);
          }

          if (profData.key.value === "semver") {
            profsemver = profData.value.value;
          }

          if (profData.key.value === "ignoreWagoUpdate") {
            profignoreWagoUpdate = profData.value.value;
          }

          if (profData.key.value === "url") {
            profurl = profData.value.value;
            const result = profurl.match(pattern);

            if (result) {
              ({ 2: profslug } = profurl.match(pattern));
            }
          }

          if (profData.key.value === "script_data" || profData.key.value === "hook_data") {
            const typeSuffix =
              (profData.key.value === "hook_data" && "-Mod") ||
              (profData.key.value === "script_data" && "-Script") ||
              "";

            profData.value.fields.forEach((obj2) => {
              let slug;
              let url;
              let version = 0;
              let semver;
              let ignoreWagoUpdate = false;
              let id;

              obj2.value.fields.forEach((obj3) => {
                if (obj3.key.value === "Name") {
                  id = obj3.value.value;
                }

                if (obj3.key.value === "version") {
                  version = Number(obj3.value.value);
                }

                if (obj3.key.value === "semver") {
                  semver = obj3.value.value;
                }

                if (obj3.key.value === "ignoreWagoUpdate") {
                  ignoreWagoUpdate = obj3.value.value;
                }

                if (obj3.key.value === "url") {
                  url = obj3.value.value;
                  const result = url.match(pattern);

                  if (result) {
                    ({ 2: slug } = url.match(pattern));
                  }
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
            auraTypeDisplay: config.addonName + "-Profile",
            addonConfig: config,
          });

          aurasFromFile.push(foundAura);
        }
      });
    }
  });

  return aurasFromFile;
}
