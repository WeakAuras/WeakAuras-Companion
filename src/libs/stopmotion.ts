// ace serializer function from wowhead https://wow.zamimg.com/js/WeakAuraExport.js

// EncodeForPrint forked from https://github.com/LetsTimeIt/mdt-compression under GPL-3.0 license
// this version was fixed by Vardex

import zlib from "zlib";

const StopMotionTemplate = {
  d: {
    tenorID: undefined,
    xOffset: 0,
    yOffset: 0,
    foregroundColor: [1, 1, 1, 1],
    desaturateBackground: false,
    animationType: "loop",
    sameTexture: true,
    startPercent: 0,
    actions: {
      start: {},
      init: {},
      finish: {},
    },
    customForegroundRows: 16,
    frameRate: 15,
    internalVersion: 51,
    animation: {
      start: {
        type: "none",
        easeStrength: 3,
        duration_type: "seconds",
        easeType: "none",
      },
      main: {
        type: "none",
        easeStrength: 3,
        duration_type: "seconds",
        easeType: "none",
      },
      finish: {
        type: "none",
        easeStrength: 3,
        duration_type: "seconds",
        easeType: "none",
      },
    },
    customForegroundFileHeight: 0,
    customBackgroundRows: 16,
    customForegroundFileWidth: 0,
    rotation: 0,
    subRegions: [
      {
        type: "subbackground",
      },
    ],
    height: 128,
    rotate: true,
    load: {
      size: {
        multi: {},
      },
      spec: {
        multi: {},
      },
      class: {
        multi: {},
      },
      talent: {
        multi: {},
      },
    },
    endPercent: 1,
    backgroundTexture: "placeholder",
    customBackgroundColumns: 16,
    foregroundTexture: "placeholder",
    backgroundPercent: 1,
    selfPoint: "CENTER",
    mirror: false,
    backgroundColor: [0.5, 0.5, 0.5, 0.5],
    regionType: "stopmotion",
    discrete_rotation: 0,
    blendMode: "BLEND",
    anchorPoint: "CENTER",
    anchorFrameType: "SCREEN",
    customForegroundColumns: 16,
    config: {},
    customForegroundFrames: 0,
    customForegroundFrameWidth: 0,
    hideBackground: true,
    customBackgroundFrames: 0,
    id: "placeholder",
    uid: "placeholder",
    customForegroundFrameHeight: 0,
    frameStrata: 1,
    width: 128,
    authorOptions: {},
    inverse: false,
    desaturateForeground: false,
    conditions: {},
    information: {},
    triggers: {
      1: {
        trigger: {
          type: "unit",
          use_absorbHealMode: true,
          subeventSuffix: "_CAST_START",
          use_absorbMode: true,
          event: "Conditions",
          subeventPrefix: "SPELL",
          spellIds: {},
          use_alwaystrue: true,
          use_unit: true,
          names: {},
          unit: "player",
          debuffType: "HELPFUL",
        },
        untrigger: {},
      },
      activeTriggerMode: -10,
    },
  },
  m: "d",
  s: "WA-Companion",
  v: 1421,
};

const mappingTable = [
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "q",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z",
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "(",
  ")",
];

const convertByteTo6bit = function (chr) {
  return mappingTable[chr].charCodeAt(0);
};

const EncodeForPrint = function (input) {
  const strlen = input.length;
  const lenMinus2 = strlen - 2;
  let i = 0;
  let buffer = [];

  while (i < lenMinus2) {
    const x1 = input[i];
    const x2 = input[i + 1];
    const x3 = input[i + 2];
    i += 3;
    let cache = x1 + x2 * 256 + x3 * 65536;
    const b1 = cache % 64;
    cache = (cache - b1) / 64;
    const b2 = cache % 64;
    cache = (cache - b2) / 64;
    const b3 = cache % 64;
    const b4 = (cache - b3) / 64;

    buffer = buffer.concat([convertByteTo6bit(b1), convertByteTo6bit(b2), convertByteTo6bit(b3), convertByteTo6bit(b4)]);
  }
  let cache = 0;
  let cache_bitlen = 0;

  while (i < strlen) {
    const x = input[i];
    cache += x * 2 ** cache_bitlen;
    cache_bitlen += 8;
    i += 1;
  }

  while (cache_bitlen > 0) {
    const bit6 = cache % 64;
    buffer = buffer.concat(convertByteTo6bit(bit6));
    cache = (cache - bit6) / 64;
    cache_bitlen -= 6;
  }
  return buffer
    .map(function (e) {
      return String.fromCharCode(e);
    })
    .join("");
};

const deflate = function (input: zlib.InputType) {
  return zlib.deflateRawSync(input, { level: 9 });
};

const encode = function (input: ArrayBuffer | Buffer | { valueOf(): ArrayBuffer | SharedArrayBuffer }) {
  return EncodeForPrint(Buffer.from(input));
};

// Serialize function
const i = [
  [/\^/g, "}"],
  [/~/g, "~|"],
  [/\s/g, "~`"],
];

function R(e) {
  return e.replace(/[^\x00-\x7F]/g, "?");
}

function A(e) {
  let result = e;

  for (const [search, replace] of i) {
    result = result.replace(search, replace);
  }
  return result;
}

function parser(e: object | boolean | number | string, a: string[], r: number): [string[], number] {
  let s: string | undefined = typeof e;

  if (s === "object" && e instanceof Array) {
    s = "array";
  }

  switch (s) {
    case "string":
      a[r + 1] = "^S";
      a[r + 2] = R(A(e));
      r += 2;
      break;
    case "number":
      a[r + 1] = "^N";
      a[r + 2] = e.toString();
      r += 2;
      break;
    case "object":
    case "array":
      r += 1;
      a[r] = "^T";

      for (const i of Object.keys(e)) {
        const key = typeof i === "string" && i.match(/^[0-9]+$/) ? parseInt(i) : i;
        [a, r] = parser(key, a, r);
        [a, r] = parser(e[i], a, r);
      }

      r += 1;
      a[r] = "^t";
      break;
    case "boolean":
      r += 1;

      if (e) {
        a[r] = "^B";
      } else {
        a[r] = "^b";
      }
      break;
    case "null":
      r += 1;
      a[r] = "^Z";
      break;
    default:
      console.log(`Cannot serialize a value of type "${s}"`);
  }
  return [a, r];
}

const serialize = function (e) {
  const [a] = parser(e, ["^1"], 1);
  return `${a.join("")}^^`;
};

function getRandomInt(min: number, max: number) {
  const [lower, upper] = [Math.ceil(min), Math.floor(max)];
  const range = upper - lower;
  return Math.trunc(Math.random() * range) + lower;
}

const GenerateUniqueID = () => {
  const uid = new Array(11);
  const tableLen = mappingTable.length;

  for (let i = 0; i < 11; i++) {
    uid[i] = mappingTable[getRandomInt(0, tableLen - 1)];
  }
  return uid.join("");
};

export { StopMotionTemplate, serialize, deflate, encode, GenerateUniqueID };
