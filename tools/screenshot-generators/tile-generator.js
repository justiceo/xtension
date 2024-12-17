import Jimp from "jimp";
import fs from "fs";

class ImageCreator {
  constructor(width, height) {
    this.width = width;
    this.height = height;
  }

  async createCanvas(background, tint) {
    let image;

    if (typeof background === "string" && background.endsWith(".png")) {
      if (!fs.existsSync(background)) {
        throw new Error("Background file does not exist.");
      }
      image = await Jimp.read(background);
      image.cover(this.width, this.height);
      if (tint) {
        image.color([{ apply: tint, params: [50] }]); // Apply a tint with 50% opacity
      }
    } else {
      image = new Jimp(this.width, this.height, background);
    }
    return image;
  }

  async loadLogo(logoPath, size) {
    if (!fs.existsSync(logoPath)) {
      throw new Error("Logo file does not exist.");
    }
    const logo = await Jimp.read(logoPath);
    await logo.resize(size, size);
    return logo;
  }

  calculateTextColor(image) {
    // Get the color at the center of the image
    // TODO: Update to use the most prominent color in the image from sampling.
    const bgColor = image.getPixelColor(
      image.bitmap.width / 2,
      image.bitmap.height / 2,
    );
    const red = (bgColor >> 24) & 255;
    const green = (bgColor >> 16) & 255;
    const blue = (bgColor >> 8) & 255;
    const brightness = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;
    return {
      textColor: brightness > 0.5 ? "black" : "white",
      chipColor: brightness > 0.5 ? "white" : "black", // Inverted colors for chips
      buttonColor: Jimp.rgbaToInt(
        (red + 60) % 255,
        (green + 60) % 255,
        (blue + 60) % 255,
        255,
      ),
    };
  }

  async loadFonts(textColor) {
    return {
      titleFont: await Jimp.loadFont(
        Jimp[`FONT_SANS_32_${textColor.toUpperCase()}`],
      ),
      descFont: await Jimp.loadFont(
        Jimp[`FONT_SANS_32_${textColor.toUpperCase()}`],
      ),
      attributesFont: await Jimp.loadFont(
        Jimp[`FONT_SANS_16_${textColor.toUpperCase()}`],
      ),
      buttonFont: await Jimp.loadFont(
        Jimp[`FONT_SANS_32_${textColor.toUpperCase()}`],
      ),
    };
  }

  renderAttributes(canvas, attributes, attributesFont, startX, startY) {
    let attributesY = startY + 140; // Position attributes under the description
    let chipHeight = 40; // Increased chip height for larger font
    for (let i = 0; i < attributes.length; ) {
      if (i >= attributes.length) {
        break;
      }

      let totalChipX = 0;
      let counter = 0;
      while (
        totalChipX + 30 < canvas.bitmap.width &&
        i + counter + 1 < attributes.length
      ) {
        const chipX =
          Jimp.measureText(attributesFont, attributes[i + counter]) + 
          30 /* Padding */ +
          10; /* Margin */
        if (totalChipX + chipX > canvas.bitmap.width) {
          break;
        }
        totalChipX += chipX;
        ++counter;
      }

      let startX = (canvas.bitmap.width - totalChipX) / 2;
      let chipX = startX;
      for (let j = 0; j < counter && i + j < attributes.length; j++) {
        const attribute = attributes[i + j];
        const measureText = Jimp.measureText(attributesFont, attribute);
        const chipWidth = measureText + 30; // Padding for the chip
        canvas.print(
          attributesFont,
          chipX,
          attributesY,
          {
            text: attribute,
            alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
            alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE,
          },
          chipWidth,
          chipHeight,
        );
        canvas.scan(chipX, attributesY, chipWidth, chipHeight, (x, y, idx) => {
          // Invert the color inside the chip
          canvas.bitmap.data[idx + 0] = 255 - canvas.bitmap.data[idx + 0];
          canvas.bitmap.data[idx + 1] = 255 - canvas.bitmap.data[idx + 1];
          canvas.bitmap.data[idx + 2] = 255 - canvas.bitmap.data[idx + 2];
        });
        chipX += chipWidth + 10; // Move to the next chip position
      }

      i = i + counter; // skip attributes that were already rendered.
      attributesY += chipHeight + 10; // Move to next line

      if (i + 1 === attributes.length) {
        break;
      }
    }
  }

  renderButton(canvas, callToAction, buttonFont, buttonColor) {
    const buttonWidth = Jimp.measureText(buttonFont, callToAction) + 60;
    const buttonHeight = 80;
    const buttonX = (canvas.bitmap.width - buttonWidth) / 2;
    const buttonY = canvas.bitmap.height - buttonHeight - 50; // Positioned at the bottom

    // Draw shadow for the button to create a raised effect
    canvas.scan(
      buttonX + 5,
      buttonY + 5,
      buttonWidth,
      buttonHeight,
      (x, y, idx) => {
        canvas.bitmap.data[idx + 0] = 0; // R
        canvas.bitmap.data[idx + 1] = 0; // G
        canvas.bitmap.data[idx + 2] = 0; // B
        canvas.bitmap.data[idx + 3] = 95; // Shadow opacity
      },
    );

    // Draw the button
    canvas.scan(buttonX, buttonY, buttonWidth, buttonHeight, (x, y, idx) => {
      canvas.bitmap.data[idx + 0] = (buttonColor >> 24) & 255;
      canvas.bitmap.data[idx + 1] = (buttonColor >> 16) & 255;
      canvas.bitmap.data[idx + 2] = (buttonColor >> 8) & 255;
      canvas.bitmap.data[idx + 3] = 255;
    });
    canvas.print(
      buttonFont,
      buttonX,
      buttonY,
      {
        text: callToAction,
        alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
        alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE,
      },
      buttonWidth,
      buttonHeight,
    );
  }

  async renderComponents(
    canvas,
    logo,
    extensionName,
    description,
    fonts,
    colors,
  ) {
    const { titleFont, descFont, attributesFont, buttonFont } = fonts;
    const callToActionHeight =  0;
    const attributesHeight =  0;
    let verticalAdjustment = callToActionHeight;

    // Render logo.
    const logoX = 50; //(canvas.bitmap.width - logo.bitmap.width) / 2; // Left padding for logo
    const logoY = 50 - verticalAdjustment; // Center logo vertically - Adjusted vertical positioning
    canvas.composite(logo, logoX, logoY);

    // Calculate vertical centering adjustments for name and description.
    const textX =
      (canvas.bitmap.width - Jimp.measureText(titleFont, extensionName)) / 2;
    const textY = logoY + logo.bitmap.height + 30;
    // canvas.print(
    //   titleFont,
    //   textX,
    //   textY,
    //   extensionName,
    //   canvas.bitmap.width - textX - 20,
    // );

    let descX =
      (canvas.bitmap.width - Jimp.measureText(descFont, description)) / 2;
    if(descX <= 0 ) {
      descX = 50;
    }
    const descY = logoY + logo.bitmap.height + 30;;
    canvas.print(
      descFont,
      descX,
      descY,
      description,
      canvas.bitmap.width - descX - 40,
    );
  }

  async createPromotionalImage({
    logoPath,
    extensionName,
    description,
    background,
    backgroundTint,
    outputPath,
  }) {
    const canvas = await this.createCanvas(background, backgroundTint);
    const logo = await this.loadLogo(logoPath, 50);
    const colors = this.calculateTextColor(canvas);
    const fonts = await this.loadFonts(colors.textColor);

    await this.renderComponents(
      canvas,
      logo,
      extensionName,
      description,
      fonts,
      colors,
    );

    await canvas.writeAsync(outputPath);
    console.log("Promotional image created successfully:", outputPath);
  }
}

// Example usage
const imageCreator = new ImageCreator(440, 280);
imageCreator.createPromotionalImage({
  logoPath: "./logo.png",
  background: "#123456", // Can be a solid color or an image path
  extensionName: "Search & Link Preview",
  description:
    "Instantly view links and search results without opening new tabs",
  outputPath: "tile2.png",
});
