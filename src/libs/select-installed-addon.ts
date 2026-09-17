export function selectInstalledAddon(
  installedAddons: readonly { addonName: string }[],
  selectedAddon: string,
) {
  if (installedAddons.some((addon) => addon.addonName === selectedAddon)) {
    return selectedAddon;
  }

  return installedAddons[0]?.addonName ?? "";
}
