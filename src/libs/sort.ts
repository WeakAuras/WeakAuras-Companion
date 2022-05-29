import { DateTime } from "luxon";
import { Aura } from "../models";

const getUpdateValueWithAllAuras = (aura: Aura) => {
  if (aura.ignoreWagoUpdate) return 2;
  else if (aura.skipWagoUpdate && aura.skipWagoUpdate >= aura.wagoVersion)
    return 1;
  else if (aura.version < aura.wagoVersion) return 0;
  return 3;
};

const getUpdateValueOnlyUpdates = (aura: Aura) => {
  return aura.skipWagoUpdate && aura.skipWagoUpdate >= aura.wagoVersion ? 1 : 0;
};

export const createSortByTime = (dir: number) => (a: { modified: Date; }, b: { modified: Date; }) => {
  return (
    DateTime.fromJSDate(b.modified)
      .diff(DateTime.fromJSDate(a.modified))
      .valueOf() * dir
  );
};

export const createSortByString = (dir: number, column: string) => {
  return (a: { [x: string]: string; }, b: { [x: string]: string; }) => {
    let A = a[column] || "",
      B = b[column] || "";

    [A, B] = [A, B].map((s) => (s + "").toLocaleString().toLowerCase());
    return A < B ? -1 * dir : A === B ? 0 : dir;
  };
};

export const createSortByType = (dir: number) => {
  const sortByType = createSortByString(dir, "auraTypeDisplay");
  const sortByName = createSortByString(1, "name");

  return (a: any, b: any) => sortByType(a, b) || sortByName(a, b);
};

export const createSortByAuthor = (dir: any, hasTypeColumn: any) => {
  const sortByAuthor = createSortByString(dir, "author");
  const secondarySortFunction = hasTypeColumn
    ? createSortByType(1)
    : createSortByString(1, "name");

  return (a: any, b: any) => sortByAuthor(a, b) || secondarySortFunction(a, b);
};

export const createSortByUpdate = (dir: number, showAllAuras: any, hasTypeColumn: any) => {
  const getUpdateValue = showAllAuras
    ? getUpdateValueWithAllAuras
    : getUpdateValueOnlyUpdates;

  const secondarySortFunction = hasTypeColumn
    ? createSortByType(1)
    : createSortByString(1, "name");

  return (a: any, b: any) => {
    const A = getUpdateValue(a),
      B = getUpdateValue(b);

    return A < B ? -1 * dir : A > B ? dir : secondarySortFunction(a, b);
  };
};
