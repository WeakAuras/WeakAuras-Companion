import fs from "node:fs";
import path from "node:path";

/** Default interface version returned when TOC file cannot be found or parsed */
const DEFAULT_INTERFACE_VERSION = "120000";

/**
 * Mapping between WoW directory value and the WeakAuras .toc file
 * This is based on Blizzard's directory naming, not on string heuristics.
 */
const WOWDIR_TO_WA_TOC = {
  // Retail family (Midnight / The War Within, including PTR & Beta)
  _retail_: "WeakAuras.toc",
  _ptr_: "WeakAuras.toc",
  _xptr_: "WeakAuras.toc",
  _beta_: "WeakAuras.toc",

  // MoP Classic family
  _classic_: "WeakAuras_Mists.toc",
  _classic_ptr_: "WeakAuras_Mists.toc",
  _classic_beta_: "WeakAuras_Mists.toc",

  // Titan Reforged (Wrath-based)
  _classic_titan_: "WeakAuras_Wrath.toc",

  // Classic Anniversary Edition (Burning Crusade)
  _anniversary_: "WeakAuras_TBC.toc",

  // Classic Era (Vanilla)
  _classic_era_: "WeakAuras_Vanilla.toc",

  // Screenshot indicates: "Classic Era & Anniversary Edition PTR" → BC Anniversary
  _classic_era_ptr_: "WeakAuras_TBC.toc",
} as const;

type WowDirToWaToc = typeof WOWDIR_TO_WA_TOC;

/** Known TOC filenames derived from the mapping for fallback */
const KNOWN_TOC_FILES = [...new Set(Object.values(WOWDIR_TO_WA_TOC))] as const;

/** Check if a string is a valid WoW directory value */
function isWowDirValue(value: string): value is keyof WowDirToWaToc {
  return value in WOWDIR_TO_WA_TOC;
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
 * Fallback logic: find an existing WeakAuras*.toc file in the addon folder
 * This protects us against unexpected Blizzard folder changes.
 */
function pickExistingWeakAurasToc(resolvedFolderPath: string): string | null {
  for (const fileName of KNOWN_TOC_FILES) {
    const filePath = path.join(resolvedFolderPath, fileName);
    if (fs.existsSync(filePath)) {
      return filePath;
    }
  }

  // Last-resort fallback: any file matching WeakAuras*.toc
  try {
    const anyToc = fs
      .readdirSync(resolvedFolderPath)
      .find((name) => /^WeakAuras.*\.toc$/i.test(name));

    return anyToc ? path.join(resolvedFolderPath, anyToc) : null;
  } catch {
    return null;
  }
}

/**
 * Reads the WeakAuras .toc file and extracts the Interface number
 */
export function grabVersionFromToc(
  wowPath: string,
  version: string, // Blizzard directory value (e.g. "_classic_", "_retail_")
): string {
  const dirValue = normalizeDirValue(version);

  const waFolderPath = path.join(
    wowPath,
    version, // Keep original casing for filesystem paths
    "Interface",
    "AddOns",
    "WeakAuras",
  );

  const resolvedFolderPath = getRealPath(waFolderPath);

  // 1) Try strict mapping based on the WoW directory value
  const mappedTocName = isWowDirValue(dirValue)
    ? WOWDIR_TO_WA_TOC[dirValue]
    : undefined;
  let resolvedTocFile: string | null = mappedTocName
    ? path.join(resolvedFolderPath, mappedTocName)
    : null;

  // 2) If the mapped file does not exist, fall back to auto-detection
  if (!resolvedTocFile || !fs.existsSync(resolvedTocFile)) {
    resolvedTocFile = pickExistingWeakAurasToc(resolvedFolderPath);
  }

  if (!resolvedTocFile) {
    // Nothing found at all → return a safe default
    return DEFAULT_INTERFACE_VERSION;
  }

  // Read the .toc file (getRealPath handles symlinks)
  try {
    const tocContent = fs.readFileSync(getRealPath(resolvedTocFile), "utf8");

    // Extract the Interface number (robust against spacing differences)
    const match = tocContent.match(/^##\s*Interface:\s*(\d+)/m);
    if (match?.[1]) {
      return match[1];
    }
  } catch (err) {
    console.log(err);
  }

  // Final fallback if the tag is missing or read failed
  return DEFAULT_INTERFACE_VERSION;
}
