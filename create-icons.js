const sharp = require("sharp");
const path = require("path");

const ICON_SIZES = [16, 32, 48, 128];
const SOURCE_IMAGE = path.join(__dirname, "assets", "icon.png");

async function createIcons() {
  for (const size of ICON_SIZES) {
    const outputPath = path.join(__dirname, "assets", `icon${size}.png`);
    await sharp(SOURCE_IMAGE)
      .resize(size, size, { fit: "cover", position: "center" })
      .png({ quality: 100, compressionLevel: 9 })
      .toFile(outputPath);
  }
  console.log("Icons created:", ICON_SIZES.map(s => `icon${s}.png`).join(", "));
}

createIcons().catch(e => {
  console.error("Failed to create icons:", e);
  process.exit(1);
});
