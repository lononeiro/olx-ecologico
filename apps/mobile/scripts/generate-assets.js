const sharp = require("sharp");
const path = require("path");

const SRC = path.resolve(__dirname, "../../../src/app/favicon.png");
const OUT = path.resolve(__dirname, "../assets/images");
const BRAND_GREEN = "#2D6A4F";

async function main() {
  // Trim whitespace so we get a tight crop of the logo mark
  const trimmed = sharp(SRC).trim();
  const trimmedBuffer = await trimmed.png().toBuffer();
  const { width, height } = await sharp(trimmedBuffer).metadata();
  const size = Math.max(width, height);

  const centeredSquare = async (canvasSize, contentSize, background) =>
    sharp({
      create: {
        width: canvasSize,
        height: canvasSize,
        channels: 4,
        background,
      },
    })
      .composite([
        {
          input: await sharp(trimmedBuffer)
            .resize(contentSize, contentSize, { fit: "inside" })
            .toBuffer(),
          gravity: "center",
        },
      ])
      .png();

  // App icon: 1024x1024, logo filling most of the canvas, white background
  await (await centeredSquare(1024, 860, { r: 255, g: 255, b: 255, alpha: 1 })).toFile(
    path.join(OUT, "icon.png")
  );

  // Adaptive icon foreground: 1024x1024 transparent, logo within the ~66% safe zone
  await (await centeredSquare(1024, 620, { r: 0, g: 0, b: 0, alpha: 0 })).toFile(
    path.join(OUT, "adaptive-icon.png")
  );

  // Splash icon: transparent background, used on top of splash backgroundColor
  await (await centeredSquare(600, 600, { r: 0, g: 0, b: 0, alpha: 0 })).toFile(
    path.join(OUT, "splash-icon.png")
  );

  // Favicon for expo web
  await (await centeredSquare(196, 170, { r: 255, g: 255, b: 255, alpha: 1 })).toFile(
    path.join(OUT, "favicon.png")
  );

  // Notification icon: Android requires a white silhouette on transparent background
  const { data, info } = await sharp(trimmedBuffer)
    .resize(256, 256, { fit: "inside" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255;
    data[i + 1] = 255;
    data[i + 2] = 255;
  }
  const silhouetteBuffer = await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer();
  await sharp({
    create: { width: 256, height: 256, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: silhouetteBuffer, gravity: "center" }])
    .png()
    .toFile(path.join(OUT, "notification-icon.png"));

  console.log("Generated assets in", OUT);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
