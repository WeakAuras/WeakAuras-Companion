import fs from "fs"; //const fs = require("fs");
import path from "path";
import sharp from "sharp"; // require("sharp"); // https://sharp.pixelplumbing.com/api-composite
import tga from "tga"; // https://github.com/steel1990/tga

function nextPow2(aSize) {
  return Math.pow(2, Math.ceil(Math.log(aSize) / Math.log(2)));
}

function calculateBestSize(width, height, count) {
  var bestcols = 1;
  var bestsize = Number.MAX_VALUE;
  var bestratio = Number.MAX_VALUE;

  for (var cols = 1; cols <= count; cols++) {
    const w = nextPow2(cols * width);
    const h = nextPow2(Math.ceil(count / cols) * height);
    const size = w * h;
    const ratio = w / h;

    if (size <= bestsize && Math.abs(ratio - 1) < bestratio) {
      bestratio = Math.abs(ratio - 1);
      bestsize = size;
      bestcols = cols;
    }
  }
  return bestcols;
}

const calculateFileSize = (width, height, pages, scaling, useSkipFrames, skipFrames) => {
  if (useSkipFrames) {
    pages = Math.floor(pages * (1 - 1 / skipFrames));
  }
  width = Math.round(width * scaling);
  height = Math.round(height * scaling);
  const cols = calculateBestSize(width, height, pages);
  const rows = Math.ceil(pages / cols);
  return {
    cols,
    rows,
    frames: pages,
    width: nextPow2(width * cols),
    height: nextPow2(height * rows),
    size: Math.round((nextPow2(width * cols) * nextPow2(height * rows) * 4) / 1024),
  };
};

const getMetaData = async (filename) => {
  const metadata = await sharp(filename, { animated: true }).metadata();
  return metadata;
};

const convert = async (filename, scaling, coalesce, useSkipFrames, skipFrames, destination, fileBuffer) => {
  try {
    if (fileBuffer === undefined) {
      fileBuffer = await fs.promises.readFile(filename);
    }

    const metadata = await sharp(fileBuffer, { animated: true }).metadata();

    let width = metadata.width;
    let pageHeight = metadata.pageHeight;
    let pages = metadata.pages;
    width = Math.round(width * scaling);
    let height = Math.round(pageHeight * scaling);

    var frames = [];
    let prevFrameBuffer;

    for (var i = 0; i < pages; i++) {
      let frame = await sharp(fileBuffer, { page: i }).resize({ width, height }).toBuffer();

      if (coalesce == true) {
        if (i > 0) {
          let compositedBuffer = await sharp(prevFrameBuffer)
            .composite([
              {
                input: frame,
                left: 0,
                top: 0,
              },
            ])
            .toBuffer();
          frames.push(compositedBuffer);
          prevFrameBuffer = Buffer.from(compositedBuffer);
        } else {
          frames.push(frame);
          prevFrameBuffer = Buffer.from(frame);
        }
      } else {
        frames.push(frame);
      }
    }

    if (useSkipFrames == true) {
      frames = frames.filter((elem, index) => {
        return index % skipFrames;
      });
    }

    const frameCount = frames.length;
    const cols = calculateBestSize(width, height, frameCount);
    const rows = Math.ceil(frameCount / cols);
    const fileWidth = nextPow2(width * cols);
    const fileHeight = nextPow2(height * rows);

    let results = sharp({
      create: {
        width: fileWidth,
        height: fileHeight,
        channels: 4,
        background: { r: 0, g: 255, b: 0, alpha: 0 },
      },
    });

    const compose = [];

    for (var index = 0; index < frames.length; index++) {
      compose.push({
        input: frames[index],
        left: (index % cols) * width,
        top: Math.floor(index / cols) * height,
      });
    }

    // results.composite(compose).toFile(`${filename.replace(/\.[^/.]+$/, "")}.png`)

    const composited = results.composite(compose); // { resolveWithObject: true }
    const rawbuffer = await composited.raw().toBuffer();
    const pixelArray = Uint8ClampedArray.from(rawbuffer);
    var buf = tga.createTgaBuffer(fileWidth, fileHeight, pixelArray); //pixelArray);
    var out = path.parse(filename).name;
    out = `${out}.x${rows}y${cols}f${frameCount}w${width}h${height}W${fileWidth}H${fileHeight}.tga`;
    const destFile = path.join(destination, out);

    await fs.promises.mkdir(destination, { recursive: true });
    await fs.promises.writeFile(destFile, buf);
    console.log(`created file: ${destFile}`);

    // make preview
    const resized = await composited.png().toBuffer();
    const preview = resized.toString("base64");
    return { destFile, preview };
  } catch (error) {
    console.log(error);
  }
};

export default { calculateFileSize, getMetaData, convert };
