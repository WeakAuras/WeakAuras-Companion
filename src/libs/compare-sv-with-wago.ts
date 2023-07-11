import fs from "node:fs";
import type { Response } from "got";
import got from "got";
import luaparse from "luaparse";

import hash from "./hash";
import { isAddonInstalled } from "./is-addon-installed";
import type { Account, AuraType, ConfigState, Version } from "@/stores/config";
import type { StashState } from "@/stores/auras";

interface WagoApiResponse {
  data: string;
  status: number;
  [Symbol.iterator](): Iterator<string>;
}

export async function compareSVwithWago(
  config: ConfigState,
  versionSelected: Version,
  accountSelected: Account,
  fetchingState: boolean,
  addonsInstalled,
  addonSelected: string,
  aurasToCompare: AuraType[],

  fetchingUpdateCallback,
  writeAddonDataCallback
) {
  const schedule = {
    id: null,
  };
  let fetching = fetchingState;
  let auras = aurasToCompare;

  const getAccountHash = function () {
    if (versionSelected) {
      const { account } = versionSelected;
      return hash.hashFnv32a(account, true);
    }
    return null;
  };

  const setFirstAddonInstalledSelected = function (
    addonsInstalled,
    addonSelected,
  ) {
    if (addonsInstalled.length === 0) {
      return addonSelected;
    }

    return addonsInstalled[0].addonName;
  };

  const getGotOptions = function () {
    return {
      http2: true,
      headers: {
        "Identifier": getAccountHash(),
        "api-key": config.wagoApiKey || "",
      },
      crossdomain: true,
      timeout: {
        request: 30000,
      },
    };
  };

  if (!versionSelected || !accountSelected) {
    return;
  }

  const addonConfigs = addonsInstalled;

  if (fetching) {
    fetchingUpdateCallback(fetching);
    return;
  } // prevent spamming UIButton
  fetching = true; // show animation
  fetchingUpdateCallback(fetching);

  if (schedule.id) {
    clearTimeout(schedule.id);
  } // cancel next 1h schedule

  let fileAuraData = [];

  for (const conf of addonConfigs) {
    if (!conf.svPathFunction) {
      continue;
    }
    const svPath = conf.svPathFunction(
      config,
      versionSelected,
      accountSelected,
    );

    if (typeof svPath !== "string") {
      continue;
    }

    try {
      const data = fs.readFileSync(svPath, "utf-8");
      // Parse saved data .lua
      const savedData = luaparse.parse(data, {
        comments: false,
        scope: true,
        locations: true,
        luaVersion: "5.1",
      });

      fileAuraData = [...fileAuraData, ...conf.parseFunction(savedData, conf)];
    } catch (err) {
      console.log(`Error reading file ${svPath}`);
      console.log(err);
      // TODO: UI needs to display something if this fails
    }
  }

  // clean up auras
  const slugs = new Array(fileAuraData.length);

  for (const foundAura of fileAuraData) {
    const { slug } = foundAura;

    const existingAura = auras.find((aura) => aura.slug === slug);

    if (!existingAura) {
      // new "slug" found, add it to the list of auras
      auras.push(foundAura);
    } else {
      const innerIndex = auras.findIndex((aura) => aura.slug === slug);

      if (innerIndex !== -1 && typeof existingAura.ids === "undefined") {
        existingAura.ids = [];
      }

      if (typeof existingAura.uids === "undefined") {
        existingAura.uids = [];
      }

      if (typeof existingAura.regionType === "undefined") {
        existingAura.regionType = null;
      }

      // add aura id to "ids" if necessary
      if (!existingAura.ids.includes(foundAura.id)) {
        existingAura.ids.push(foundAura.id);
      }

      // add aura uid to "uids" if necessary
      if (foundAura.uid && !existingAura.uids.includes(foundAura.uid)) {
        existingAura.uids.push(foundAura.uid);
      }

      // update ignore flags
      existingAura.ignoreWagoUpdate = foundAura.ignoreWagoUpdate;

      // update version
      existingAura.version = foundAura.version;
      existingAura.semver = foundAura.semver;

      // wipe encoded if ignored (force re-fetching it on unignore)
      if (foundAura.ignoreWagoUpdate) {
        existingAura.encoded = null;
      }

      // ensure config
      existingAura.auraType = foundAura.auraType;
      existingAura.auraTypeDisplay = foundAura.auraTypeDisplay;
      existingAura.addonConfig = foundAura.addonConfig;
    }

    if (!slugs.includes(slug)) {
      slugs.push(slug);
    }
  }

  // remove orphans
  auras = auras.filter((aura) => slugs.includes(aura.slug));

  // Get each encoded string
  const promisesWagoCallsComplete = [];
  const promisesWagoDataCallsComplete = [];
  let allAurasFetched = [];
  const received = [];

  addonConfigs.forEach((config) => {
    // Make a list of unique auras to fetch
    const fetchAuras = auras
      .filter(
        (aura) =>
          !(
            config.ignoreOwnAuras &&
            !!aura.author &&
            aura.author === config.wagoUsername
          ) && aura.addonConfig.addonName === config.addonName,
      )
      .map((aura) => aura.slug);

    // Test if list is empty
    if (fetchAuras.length === 0) {
      console.log("No auras to fetch");
      return;
    }

    allAurasFetched = [...allAurasFetched, ...fetchAuras];

    // Get data from Wago api
    promisesWagoCallsComplete.push(
      got<WagoApiResponse>(`${config.wagoAPI}?ids=${fetchAuras.join()}`, {
        ...getGotOptions,
        responseType: "json",
      })
        .then((response: Response<WagoApiResponse>) => {
          const data: WagoApiResponse = response.body;

          // metadata received from Wago API
          Object.values(data).forEach((wagoData) => {
            received.push(wagoData.slug);
            received.push(wagoData._id);

            auras.forEach((aura) => {
              if (aura.slug === wagoData.slug || aura.slug === wagoData._id) {
                aura.name = wagoData.name;
                aura.author = wagoData.username;
                aura.created = new Date(wagoData.created);
                aura.wagoSemver = wagoData.versionString;
                aura.changelog = wagoData.changelog;
                aura.modified = new Date(wagoData.modified);
                aura.regionType = wagoData.regionType;
                aura.wagoid = wagoData._id;
                aura.source = "Wago";

                if (
                  !aura.ignoreWagoUpdate &&
                  wagoData.version > aura.version &&
                  (aura.wagoVersion === null ||
                    wagoData.version > aura.wagoVersion || aura.encoded === null) &&
                  !(
                    config.ignoreOwnAuras &&
                    wagoData.username === config.wagoUsername
                  )
                ) {
                  promisesWagoDataCallsComplete.push(
                    got(
                      `https://data.wago.io/api/raw/encoded?id=${wagoData._id}`,
                      {
                        ...getGotOptions,
                        responseType: "text",
                      },
                    ),
                  );
                }
                aura.wagoVersion = wagoData.version;
              }
            });
          });
        })
        .catch((error) => {
          console.log(JSON.stringify(error));
          fetching = false;
          fetchingUpdateCallback(fetching);

          if (schedule.id) {
            clearTimeout(schedule.id);
          }

          schedule.id = setTimeout(compareSVwithWago, 1000 * 60 * 30);
        }),
    );
  });

  if (promisesWagoCallsComplete.length === 0) {
    // No data for any addon available. Nothing to update.
    try {
      if (
        isAddonInstalled(config, "WeakAuras") ||
        isAddonInstalled(config, "Plater")
      ) {
        writeAddonDataCallback();
      }
    } finally {
      fetching = false;
      fetchingUpdateCallback(fetching);

      setFirstAddonInstalledSelected(addonsInstalled, addonSelected);

      accountSelected.lastWagoUpdate = new Date();

      if (schedule.id) {
        clearTimeout(schedule.id);
      }

      schedule.id = setTimeout(compareSVwithWago, 1000 * 60 * 60);
    }
    return;
  }

  // those promises are already resolved in line 1395
  // they should not throw an error except maybe for external error like timeout
  Promise.all(promisesWagoCallsComplete)
    .then(() => {
      console.log("promisesWagoCallsComplete");

      // Test if list is empty after resolving wagoCalls
      if (allAurasFetched.length === 0) {
        accountSelected.lastWagoUpdate = new Date();

        if (schedule.id) {
          clearTimeout(schedule.id);
        }

        schedule.id = setTimeout(compareSVwithWago, 1000 * 60 * 60);
        return;
      }

      // catch response error before resolving them with Promise.all
      // by catching them before rejection, we don't exit Promise.all
      // with the first error
      const promisesResolved = promisesWagoDataCallsComplete.map((promise) =>
        promise.catch((err2) => ({
          config: { params: { id: err2.config.params.id } },
          status: err2.response.status,
        })),
      );

      // resolving all wago encoded strings answers simultaneously
      Promise.all(promisesResolved)
        .then((wagoEncodedStrings) => {
          console.log("promisesWagoDataCallsComplete");

          wagoEncodedStrings.forEach((wagoResp) => {
            const id  = wagoResp?.requestUrl?.searchParams.get("id");

            if (id) {
              if (wagoResp.statusCode === 200) {
                auras.forEach((aura) => {
                  if (aura.wagoid === id) {
                    // auras[index].encoded = wagoResp.body;
                    aura.encoded = wagoResp.body;
                  }
                });
              } else {
                auras.forEach((aura) => {
                  if (aura.wagoid === id) {
                    // Setting the version back to the aura version
                    // won't show update available
                    // TODO: create status update-failed?
                    aura.wagoVersion = aura.version;
                    console.log(`error ${wagoResp.statusMessage}`);
                  }
                });
              }
            }
          });
        })
        .catch((error) => {
          console.log(error);

          // schedule in 30mn on error
          if (schedule.id) {
            clearTimeout(schedule.id);
          }

          schedule.id = setTimeout(compareSVwithWago, 1000 * 60 * 30);
        })
        .then(() => {
          allAurasFetched.forEach((toFetch) => {
            if (!received.includes(toFetch)) {
              // No data received for this aura => remove from list
              auras.forEach((aura, index) => {
                if (aura && aura.slug === toFetch) {
                  console.log(`no data received for ${aura.slug}`);
                  auras.splice(index, 1);
                }
              });
            }
          });

          // We are done with the Wago API, update data.lua

          try {
            writeAddonDataCallback();
          } finally {
            fetching = false;
            fetchingUpdateCallback(fetching);

            setFirstAddonInstalledSelected(addonsInstalled, addonSelected);

            accountSelected.lastWagoUpdate = new Date();

            if (schedule.id) {
              clearTimeout(schedule.id);
            }

            schedule.id = setTimeout(compareSVwithWago, 1000 * 60 * 60);
          }
        });
    })
    .catch((error) => {
      console.log(JSON.stringify(error));

      // Schedule in 30 minutes on error
      if (schedule.id) {
        clearTimeout(schedule.id);
      }

      schedule.id = setTimeout(compareSVwithWago, 1000 * 60 * 30);
    });
}
