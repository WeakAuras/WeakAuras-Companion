import fs from "node:fs";
import { ipcRenderer } from "electron";
import type {
  Account,
  AddonConfig,
  AuraType,
  ConfigState,
  Version,
} from "@/stores/config";
import type { Response } from "got";
import got from "got";
import luaparse from "luaparse";

import hash from "./hash";
import { isAddonInstalled } from "./is-addon-installed";

function refreshWago() {
  ipcRenderer.invoke("refreshWago");
}

interface WagoApiResponse {
  data: string;
  status: number;
  [Symbol.iterator](): Iterator<string>;
}

type FetchingUpdateCallback = (fetching: boolean) => void;
type WriteAddonDataCallback = () => void;

export async function compareSVwithWago(
  config: ConfigState,
  versionSelected: Version,
  accountSelected: Account,
  fetchingState: boolean,
  addonsInstalled: AddonConfig[],
  addonSelected: string,
  aurasToCompare: AuraType[],
  fetchingUpdateCallback: FetchingUpdateCallback,
  writeAddonDataCallback: WriteAddonDataCallback,
) {
  const schedule = {
    id: null,
  };
  const auras = aurasToCompare;
  const MINUTES_30 = 1000 * 60 * 30;
  const MINUTES_60 = 1000 * 60 * 60;

  let fetching = fetchingState;

  const getAccountHash = (): string => {
    if (versionSelected) {
      const { account } = versionSelected;
      return hash.hashFnv32a(account, true).toString();
    }
    return "";
  };

  const setFirstAddonInstalledSelected = (
    addonsInstalled: AddonConfig[],
    addonSelected: string,
  ) => {
    if (addonsInstalled.length === 0) {
      return addonSelected;
    }

    return addonsInstalled[0].addonName;
  };

  const scheduleRefreshWago = (timeout: number) => {
    if (schedule.id) {
      clearTimeout(schedule.id);
    }

    schedule.id = setTimeout(refreshWago, timeout);
  };

  const gotOptions = {
    http2: true,
    headers: {
      "Identifier": getAccountHash(),
      "api-key": config.wagoApiKey || "",
      "User-Agent": `WeakAuras Companion ${__APP_VERSION__}`,
    },
    timeout: {
      request: 30000,
    },
    retry: {
      limit: 0,
    },
  };

  if (!versionSelected || !accountSelected) {
    return;
  }
  const addonConfigs = addonsInstalled;

  if (fetching) {
    // prevent spamming UIButton
    fetchingUpdateCallback(fetching);
    return;
  }

  fetching = true; // show animation
  fetchingUpdateCallback(fetching);
  scheduleRefreshWago(0); // cancel next 1h schedule

  let fileAuraData = [];

  const readFile = (path: string): string => {
    try {
      return fs.readFileSync(path, "utf-8");
    } catch (err) {
      console.error(`Error reading file ${path}`, err);
      return "";
    }
  };

  const parseLua = (data: string) => {
    try {
      return luaparse.parse(data, {
        comments: false,
        scope: true,
        locations: true,
        luaVersion: "5.1",
      });
    } catch (err) {
      console.error("Error parsing Lua data", err);
      return null;
    }
  };

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

    const data = readFile(svPath);
    const savedData = parseLua(data);

    if (savedData) {
      fileAuraData = [...fileAuraData, ...conf.parseFunction(savedData, conf)];
    }
  }

  // clean up auras
  const slugs = Array.from({ length: fileAuraData.length });

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
  for (let index = auras.length - 1; index > -1; index -= 1) {
    if (!slugs.includes(auras[index].slug)) {
      auras.splice(index, 1);
    }
  }

  // Get each encoded string
  const promisesWagoCallsComplete = [];
  const promisesWagoDataCallsComplete = [];
  const received = [];
  let allAurasFetched = [];

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
      got
        .post<WagoApiResponse>(config.wagoAPI, {
          ...gotOptions,
          responseType: "json",
          json: {
            ids: fetchAuras,
          },
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
                    wagoData.version > aura.wagoVersion ||
                    aura.encoded === null) &&
                  !(
                    config.ignoreOwnAuras &&
                    wagoData.username === config.wagoUsername
                  )
                ) {
                  promisesWagoDataCallsComplete.push(
                    got(
                      `https://data.wago.io/api/raw/encoded?id=${wagoData._id}`,
                      {
                        ...gotOptions,
                        responseType: "text",
                      },
                    ),
                  );
                }
                aura.wagoVersion = wagoData.version;
              }
            });
          });
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

      scheduleRefreshWago(MINUTES_60);
    }
    return;
  }

  const handleAuraUpdate = (wagoResp: any, auras: any[]) => {
    const id = wagoResp?.requestUrl?.searchParams?.get("id");

    if (id) {
      if (wagoResp.statusCode === 200) {
        auras.forEach((aura) => {
          if (aura.wagoid === id) {
            aura.encoded = wagoResp.body;
          }
        });
      } else {
        auras.forEach((aura) => {
          if (aura.wagoid === id) {
            aura.wagoVersion = aura.version;
            console.error(
              wagoResp.statusCode,
              `error ${wagoResp.statusMessage}`,
            );
          }
        });
      }
    }
  };

  const handlePromises = async () => {
    console.log("promisesWagoCallsComplete");
    let nextRefresh = MINUTES_60;

    try {
      const results = await Promise.allSettled(promisesWagoCallsComplete);

      results.forEach((result, index) => {
        if (result.status === "rejected") {
          const error = result.reason;
          const responseCode = error?.response?.statusCode || "Unknown";
          if (responseCode && responseCode !== 404) {
            nextRefresh = MINUTES_30;
          }
          console.error(
            error.request.requestUrl.href,
            error?.message,
            `HTTP status code: ${responseCode}`,
            `Request parameters: ${JSON.stringify(error?.config?.params)}`,
          );
        } else if (result.status !== "fulfilled") {
          console.log("Unknown status", index, result);
        }
      });
    } catch (error) {
      console.error("Error handling promisesWagoCallsComplete:", error);
      nextRefresh = MINUTES_30;
    }

    if (allAurasFetched.length === 0) {
      accountSelected.lastWagoUpdate = new Date();
      scheduleRefreshWago(nextRefresh);
      return;
    }

    try {
      const promisesResolved = promisesWagoDataCallsComplete.map((promise) =>
        promise.catch((error: any) => {
          if (error.response?.statusCode !== 404) {
            nextRefresh = MINUTES_30;
          }
          console.error(
            error.request.requestUrl.href,
            error?.message,
            `HTTP status code: ${error.response?.statusCode}`,
            `Request parameters: ${JSON.stringify(error?.config?.params)}`,
          );
          return {
            config: { params: { id: error?.config?.params?.id } },
            statusCode: error.response?.statusCode || "Unknown",
          };
        }),
      );

      const wagoEncodedStrings = await Promise.all(promisesResolved);
      console.log("promisesWagoDataCallsComplete");

      wagoEncodedStrings.forEach((wagoResp: WagoApiResponse) =>
        handleAuraUpdate(wagoResp, auras),
      );

      for (let i = auras.length - 1; i >= 0; i--) {
        if (!received.includes(auras[i]?.slug)) {
          auras.splice(i, 1);
        }
      }
    } catch (error) {
      console.error("Error resolving promisesWagoDataCallsComplete:", error);
      nextRefresh = MINUTES_30;
    }

    try {
      writeAddonDataCallback();
    } finally {
      fetching = false;
      fetchingUpdateCallback(fetching);
      setFirstAddonInstalledSelected(addonsInstalled, addonSelected);
      accountSelected.lastWagoUpdate = new Date();
      scheduleRefreshWago(nextRefresh);
    }
  };

  handlePromises();
}
