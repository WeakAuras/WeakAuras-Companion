function hashFnv32a(
  str: string,
  asString: boolean,
  seed: number = 0x811c9dc5,
): string | number {
  // Calculate a 32 bit FNV-1a hash
  let hval = seed;

  for (let i = 0, l = str.length; i < l; i++) {
    hval ^= str.charCodeAt(i);

    hval +=
      (hval << 1) + (hval << 4) + (hval << 7) + (hval << 8) + (hval << 24);
  }

  if (asString) {
    return `0000000${(hval >>> 0).toString(16)}`.substring(-8);
  }

  return hval >>> 0;
}

export default { hashFnv32a };
