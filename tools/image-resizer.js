import Jimp from "jimp";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Sizes for different types of images as defined by Chrome Webstore.
// Ref - https://developer.chrome.com/docs/webstore/images and
// https://developer.chrome.com/docs/webstore/best-listing#images
const IMAGE_SIZES = {
  icon: [
    { width: 16, height: 16 },
    { width: 24, height: 24 },
    { width: 32, height: 32 },
    { width: 48, height: 48 },
    { width: 128, height: 128 },
  ],
  screenshot: [
    { width: 1280, height: 800 },
    { width: 640, height: 400 },
  ],
  tile: [{ width: 440, height: 280 }],
  marquee: [{ width: 1400, height: 560 }],
};

const PAUSE_ICON_PATH = path.join(dirname(fileURLToPath(import.meta.url)), "pause-icon.png");

/**
 * Class for resizing images based on predefined sizes for different image types.
 *
 * To instantiate and use the ImageResizer class:
 * import minimist from "minimist";
 * new ImageResizer().process(minimist(process.argv.slice(2)));
 * > node image-resizer.js --icon=src/assets/icon.png
 */
export class ImageResizer {
  /**
   * Resize a single image to multiple dimensions.
   * Also applies greyscale and a pause icon overlay for icon types.
   * @param {string} filePath - The path to the image file.
   * @param {Array} dimensions - An array of dimension objects containing width and height.
   * @param {boolean} isIcon - True if the image type is 'icon'.
   */
  async resizeImage(filePath, dimensions, isIcon = false) {
    try {
      const image = await Jimp.read(filePath);
      const extname = path.extname(filePath);
      const dirname = path.dirname(filePath);

      for (const { width, height } of dimensions) {
        let resizedImage;
        if (isIcon) {
          resizedImage = image.clone().resize(width, height);
        } else {
          resizedImage = image.clone().cover(width, height);
        }

        const basename = path.basename(filePath, extname);
        let newFileName = `${dirname}/${basename}-${width}x${height}${extname}`;
        await resizedImage.writeAsync(newFileName);
        console.log(`Resized image saved as: ${newFileName}`);

        if (isIcon) {
          // Save greyscale version
          let greyImage = resizedImage.clone().greyscale();
          let greyFileName = `${dirname}/${basename}-${width}x${height}-grey${extname}`;
          await greyImage.writeAsync(greyFileName);
          console.log(`Greyscale image saved as: ${greyFileName}`);

          // Save paused overlay version
          let pauseIcon = await Jimp.read(PAUSE_ICON_PATH);
          let pausedImage = resizedImage.clone();
          // Resize pause icon to half the width and height and position it at the bottom right
          pauseIcon.resize(width / 2, height / 2);
          pausedImage.composite(
            pauseIcon,
            width - width / 2,
            height - height / 2,
            {
              mode: Jimp.BLEND_SOURCE_OVER,
              opacityDest: 1,
              opacitySource: 0.8,
            },
          );
          let pauseFileName = `${dirname}/${basename}-${width}x${height}-paused${extname}`;
          await pausedImage.writeAsync(pauseFileName);
          console.log(`Paused overlay image saved as: ${pauseFileName}`);
        }
      }
    } catch (error) {
      console.error("Error resizing image:", error);
    }
  }

  /**
   * Process command line arguments and resize images based on specified types.
   */
  resizeImages(args) {
    for (let key in IMAGE_SIZES) {
      if (args[key]) {
        const isIcon = key === "icon";
        this.resizeImage(args[key], IMAGE_SIZES[key], isIcon);
      }
    }
  }
}
