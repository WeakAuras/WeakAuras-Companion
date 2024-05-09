import fs from "node:fs";
import type { Response } from "got";
import got from "got";
import luaparse from "luaparse";
import { ipcRenderer } from "electron";

import hash from "./hash";
import { isAddonInstalled } from "./is-addon-installed";
import type {
  Account,
  AddonConfig,
  AuraType,
  ConfigState,
  Version,
} from "@/stores/config";

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
  config: ConfigState | null, // Added null check for config parameter
  versionSelected: Version | null, // Added null check for versionSelected parameter
  accountSelected: Account | null, // Added null check for accountSelected parameter
  fetchingState: boolean,
  addonsInstalled: AddonConfig[],
  addonSelected: string,
  aurasToCompare: AuraType[],
  fetchingUpdateCallback: FetchingUpdateCallback,
  writeAddonDataCallback: WriteAddonDataCallback,
) {
  if (!config || !versionSelected || !accountSelected) return; // Added null check for config, versionSelected, and accountSelected

  const schedule = {
    id: null,
  };
  const auras = aurasToCompare;
  const MINUTES_30 = 1000 * 60 * 30;
  const MINUTES_60 = 1000 * 60 * 60;

  let fetching = fetchingState;

  const getAccountHash = () => {
    if (versionSelected) {
      const { account } = versionSelected;
      return hash.hashFnv32a(account, true);
    }
    return null;
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

  const getGotOptions = () => ({
    http2: true,
    headers: {
      "Identifier": getAccountHash(),
      "api-key": config.wagoApiKey || "",
    },
    crossdomain: true,
    timeout: {
      request: 30000,
    },
  });

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
  for (let index = auras.length - 1; index > -1; index -= 1) {
    if (!slugs.includes(auras[index]?.slug)) {
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
          ...getGotOptions,
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
            console.error(`error ${wagoResp.statusMessage}`);
          }
        });
      }
    }
  };

  const handlePromises = async () => {
    console.log("promisesWagoCallsComplete");

    try {
      await Promise.all(promisesWagoCallsComplete);
    } catch (error: any) {
      console.error("promisesWagoCallsComplete error");
      console.log(JSON.stringify(error));
      fetching = false;
      fetchingUpdateCallback(fetching);

      const delay =
        error.code === "ERR_NON_2XX_3XX_RESPONSE" // Server said nope
          ? 1000 * 10 // 10 seconds
          : MINUTES_30;
      scheduleRefreshWago(delay);
      return;
    }

    if (allAurasFetched.length === 0) {
      accountSelected.lastWagoUpdate = new Date();
      scheduleRefreshWago(MINUTES_60);
      return;
    }

    const promisesResolved = promisesWagoDataCallsComplete.map((promise) =>
      promise.catch((error: any) => ({
        config: { params: { id: error.config.params.id } },
        status: error.response.status,
      })),
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

    try {
      writeAddonDataCallback();
    } finally {
      fetching = false;
      fetchingUpdateCallback(fetching);
      setFirstAddonInstalledSelected(addonsInstalled, addonSelected);
      accountSelected.lastWagoUpdate = new Date();
      scheduleRefreshWago(MINUTES_60);
    }
  };

  handlePromises();
}
