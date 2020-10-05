const { DateTime } = require("luxon");

const getUpdateValueWithAllAuras = (aura) => {
  if (aura.version < aura.wagoVersion) return 1;
  else if (aura.skipWagoUpdate && aura.skipWagoUpdate >= aura.wagoVersion)
    return 2;
  else if (aura.ignoreWagoUpdate) return 3;
  return 4;
};

const getUpdateValueOnlyUpdates = (aura) => {
  return aura.skipWagoUpdate && aura.skipWagoUpdate >= aura.wagoVersion ? 1 : 0;
};

export const createSortByTime = (dir) => (a, b) => {
  return (
    DateTime.fromJSDate(b.modified)
      .diff(DateTime.fromJSDate(a.modified))
      .valueOf() * dir
  );
};

export const createSortByString = (dir, column) => {
  return (a, b) => {
    let A = a[column] || "",
      B = b[column] || "";

    [A, B] = [A, B].map((s) => (s + "").toLocaleString().toLowerCase());
    return A < B ? -1 * dir : A === B ? 0 : dir;
  };
};

export const createSortByType = (dir) => {
  const sortByType = createSortByString(dir, "auraTypeDisplay");
  const sortByName = createSortByString(1, "name");

  return (a, b) => {
    const typeDiff = sortByType(a, b);
    return typeDiff !== 0 ? typeDiff : sortByName(a, b);
  };
};

export const createSortByAuthor = (dir, hasTypeColumn) => {
  const sortByAuthor = createSortByString(dir, "author");
  const secondarySearchFunction = hasTypeColumn
    ? createSortByType(1)
    : createSortByString(1, "name");

  return (a, b) => {
    const authorDiff = sortByAuthor(a, b);
    return authorDiff !== 0 ? authorDiff : secondarySearchFunction(a, b);
  };
};

export const createSortByUpdate = (dir, showAllAuras, hasTypeColumn) => {
  const getUpdateValue = showAllAuras
    ? getUpdateValueWithAllAuras
    : getUpdateValueOnlyUpdates;

  const secondarySearchFunction = hasTypeColumn
    ? createSortByType(1)
    : createSortByString(1, "name");

  return (a, b) => {
    const A = getUpdateValue(a),
      B = getUpdateValue(b);

    return A < B ? -1 * dir : A > B ? dir : secondarySearchFunction(a, b);
  };
};
