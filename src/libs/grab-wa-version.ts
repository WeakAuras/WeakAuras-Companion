import fs from "node:fs";
import path from "node:path";

/** Default interface version returned when TOC file cannot be found or parsed */
const DEFAULT_INTERFACE_VERSION = "120000";

/**
 * Mapping between WoW directory value and the TOC file suffix.
 * Both WeakAuras and Plater use the same suffix pattern.
 */
const WOWDIR_TO_TOC_SUFFIX = {
  // Retail family (Midnight / The War Within, including PTR & Beta)
  _retail_: "",
  _ptr_: "",
  _xptr_: "",
  _beta_: "",

  // MoP Classic family
  _classic_: "_Mists",
  _classic_ptr_: "_Mists",
  _classic_beta_: "_Mists",

  // Titan Reforged (Wrath-based)
  _classic_titan_: "_Wrath",

  // Classic Anniversary Edition (Burning Crusade)
  _anniversary_: "_TBC",

  // Classic Era (Vanilla)
  _classic_era_: "_Vanilla",

  // Classic Era & Anniversary Edition PTR → BC Anniversary
  _classic_era_ptr_: "_TBC",
} as const;

type WowDirToTocSuffix = typeof WOWDIR_TO_TOC_SUFFIX;

/** Known TOC suffixes derived from the mapping for fallback */
const KNOWN_TOC_SUFFIXES = [
  ...new Set(Object.values(WOWDIR_TO_TOC_SUFFIX)),
] as const;

/** Check if a string is a valid WoW directory value */
function isWowDirValue(value: string): value is keyof WowDirToTocSuffix {
  return value in WOWDIR_TO_TOC_SUFFIX;
}

/**
 * Normalize the directory value for safe lookups
 */
function normalizeDirValue(dirValue: string): string {
  return dirValue.trim().toLowerCase();
}

/**
 * Resolve real path, handling symlinks via fs.realpathSync
 */
function getRealPath(filePath: string): string {
  try {
    return fs.realpathSync(filePath);
  } catch (err) {
    console.log(err);
    return filePath;
  }
}

/**
 * Fallback logic: find an existing TOC file for an addon in the folder.
 * Tries known suffixes first, then falls back to any matching TOC file.
 */
function pickExistingAddonToc(
  addonFolder: string,
  addonName: string,
): string | null {
  // Try known suffixes first
  for (const suffix of KNOWN_TOC_SUFFIXES) {
    const fileName = `${addonName}${suffix}.toc`;
    const filePath = path.join(addonFolder, fileName);
    if (fs.existsSync(filePath)) {
      return filePath;
    }
  }

  // Last-resort fallback: any file matching AddonName*.toc
  try {
    const pattern = new RegExp(`^${addonName}.*\\.toc$`, "i");
    const anyToc = fs
      .readdirSync(addonFolder)
      .find((name) => pattern.test(name));

    return anyToc ? path.join(addonFolder, anyToc) : null;
  } catch {
    return null;
  }
}

/**
 * Extract Interface version from a .toc file's content.
 * Handles multiple versions (e.g., "## Interface: 110000, 120000") by returning the highest.
 */
function extractInterfaceVersion(tocContent: string): string | null {
  const lineMatch = tocContent.match(/^##\s*Interface:\s*(.+)$/m);
  if (!lineMatch) {
    return null;
  }

  const versions = lineMatch[1].match(/\d+/g);
  if (!versions || versions.length === 0) {
    return null;
  }

  // Return the highest version number
  return versions.reduce((max, v) => (Number(v) > Number(max) ? v : max));
}

/**
 * Get the path to an addon's folder, or null if it doesn't exist
 */
function getAddonFolderPath(
  wowPath: string,
  wowVersion: string,
  addonName: string,
): string | null {
  const addonFolderPath = path.join(
    wowPath,
    wowVersion,
    "Interface",
    "AddOns",
    addonName,
  );

  if (!fs.existsSync(addonFolderPath)) {
    return null;
  }

  return getRealPath(addonFolderPath);
}

/**
 * Get Interface version from an addon's .toc file.
 * Uses smart version-specific TOC mapping (e.g., WeakAuras_Mists.toc for classic).
 */
function grabVersionFromAddonToc(
  wowPath: string,
  wowVersion: string,
  addonName: string,
): string | null {
  const addonFolder = getAddonFolderPath(wowPath, wowVersion, addonName);
  if (!addonFolder) {
    return null;
  }

  const dirValue = normalizeDirValue(wowVersion);

  // 1) Try strict mapping based on the WoW directory value
  let resolvedTocFile: string | null = null;
  if (isWowDirValue(dirValue)) {
    const suffix = WOWDIR_TO_TOC_SUFFIX[dirValue];
    const tocName = `${addonName}${suffix}.toc`;
    const tocPath = path.join(addonFolder, tocName);
    if (fs.existsSync(tocPath)) {
      resolvedTocFile = tocPath;
    }
  }

  // 2) If the mapped file does not exist, fall back to auto-detection
  if (!resolvedTocFile) {
    resolvedTocFile = pickExistingAddonToc(addonFolder, addonName);
  }

  if (!resolvedTocFile) {
    return null;
  }

  // Read the .toc file (getRealPath handles symlinks)
  try {
    const tocContent = fs.readFileSync(getRealPath(resolvedTocFile), "utf8");
    return extractInterfaceVersion(tocContent);
  } catch (err) {
    console.log(err);
    return null;
  }
}

/**
 * Get Interface version from WeakAuras or Plater (whichever is installed).
 * Tries WeakAuras first, then Plater, then falls back to default.
 */
export function grabVersionFromInstalledAddons(
  wowPath: string,
  wowVersion: string,
): string {
  // Try WeakAuras first
  const waVersion = grabVersionFromAddonToc(wowPath, wowVersion, "WeakAuras");
  if (waVersion) {
    console.log(`Using Interface version from WeakAuras: ${waVersion}`);
    return waVersion;
  }

  // Try Plater
  const platerVersion = grabVersionFromAddonToc(wowPath, wowVersion, "Plater");
  if (platerVersion) {
    console.log(`Using Interface version from Plater: ${platerVersion}`);
    return platerVersion;
  }

  // No addon found, return default
  console.log(
    "Neither WeakAuras nor Plater found, using default Interface version",
  );
  return DEFAULT_INTERFACE_VERSION;
}
