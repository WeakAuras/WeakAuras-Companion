import fs from "node:fs";
import path from "node:path";

// https://sharp.pixelplumbing.com/api-composite
import sharp from "sharp";

// https://github.com/steel1990/tga
import tga from "tga";

function nextPow2(aSize) {
  return 2 ** Math.ceil(Math.log(aSize) / Math.log(2));
}

function calculateBestSize(width: number, height: number, count: number) {
  let bestcols = 1;
  let bestsize = Number.MAX_VALUE;
  let bestratio = Number.MAX_VALUE;

  for (let cols = 1; cols <= count; cols++) {
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

function calculateFileSize(
  width: number,
  height: number,
  pages: number,
  scaling: number,
  useSkipFrames: boolean,
  skipFrames: number,
) {
  const filePages = useSkipFrames
    ? Math.floor(pages * (1 - 1 / skipFrames))
    : pages;
  const fileWidth = Math.round(width * scaling);
  const fileHeight = Math.round(height * scaling);

  const cols = calculateBestSize(fileWidth, fileHeight, filePages);
  const rows = Math.ceil(filePages / cols);

  const widthPow2 = nextPow2(fileWidth * cols);
  const heightPow2 = nextPow2(fileHeight * rows);

  return {
    cols,
    rows,
    frames: filePages,
    width: widthPow2,
    height: heightPow2,
    size: Math.round((widthPow2 * heightPow2 * 4) / 1024),
  };
}

async function getMetaData(filename: string | Buffer) {
  return await sharp(filename, { animated: true }).metadata();
}

async function convert(
  filename: string,
  scaling: number,
  coalesce: boolean,
  useSkipFrames: boolean,
  skipFrames: number,
  destination: string,
  fileBuffer: any,
) {
  let incomingFileBuffer = fileBuffer;
  try {
    if (incomingFileBuffer === undefined) {
      incomingFileBuffer = await fs.promises.readFile(filename);
    }

    const metadata = await sharp(incomingFileBuffer, {
      animated: true,
    }).metadata();

    let { width } = metadata;
    const { pageHeight, pages } = metadata;
    width = Math.round(width * scaling);
    const height = Math.round(pageHeight * scaling);

    let frames = [];
    let prevFrameBuffer;

    for (let i = 0; i < pages; i++) {
      const frame = await sharp(incomingFileBuffer, { page: i })
        .resize({ width, height })
        .toBuffer();

      if (coalesce === true) {
        if (i > 0) {
          const compositedBuffer = await sharp(prevFrameBuffer)
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

    if (useSkipFrames === true) {
      frames = frames.filter((elem, index) => {
        return index % skipFrames;
      });
    }

    const frameCount = frames.length;
    const cols = calculateBestSize(width, height, frameCount);
    const rows = Math.ceil(frameCount / cols);
    const fileWidth = nextPow2(width * cols);
    const fileHeight = nextPow2(height * rows);

    const results = sharp({
      create: {
        width: fileWidth,
        height: fileHeight,
        channels: 4,
        background: { r: 0, g: 255, b: 0, alpha: 0 },
      },
    });

    const compose = [];

    for (let index = 0; index < frames.length; index++) {
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
    const buf = tga.createTgaBuffer(fileWidth, fileHeight, pixelArray); // pixelArray);
    let out = path.parse(filename).name;
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
}

export default { calculateFileSize, getMetaData, convert };
