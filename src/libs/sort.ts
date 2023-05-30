import { DateTime } from "luxon";

function getUpdateValueWithAllAuras(aura) {
  if (aura.ignoreWagoUpdate) {
    return 2;
  } else if (aura.version < aura.wagoVersion) {
    return 0;
  }
  return 3;
}

export function createSortByTime(dir) {
  return (a, b) => {
    return DateTime.fromJSDate(b.modified).diff(DateTime.fromJSDate(a.modified)).valueOf() * dir;
  };
}

export function createSortByString(dir, column) {
  return (a, b) => {
    let A = a[column] || "";
    let B = b[column] || "";

    [A, B] = [A, B].map(s => `${s}`.toLocaleString().toLowerCase());
    return A < B ? -1 * dir : A === B ? 0 : dir;
  };
}

export function createSortByType(dir) {
  const sortByType = createSortByString(dir, "auraTypeDisplay");
  const sortByName = createSortByString(1, "name");

  return (a, b) => sortByType(a, b) || sortByName(a, b);
}

export function createSortByAuthor(dir, hasTypeColumn) {
  const sortByAuthor = createSortByString(dir, "author");
  const secondarySortFunction = hasTypeColumn ? createSortByType(1) : createSortByString(1, "name");

  return (a, b) => sortByAuthor(a, b) || secondarySortFunction(a, b);
}

export function createSortByUpdate(dir, hasTypeColumn) {
  const getUpdateValue = getUpdateValueWithAllAuras;
  const secondarySortFunction = hasTypeColumn ? createSortByType(1) : createSortByString(1, "name");

  return (a, b) => {
    const A = getUpdateValue(a);
    const B = getUpdateValue(b);

    return A < B ? -1 * dir : A > B ? dir : secondarySortFunction(a, b);
  };
}
