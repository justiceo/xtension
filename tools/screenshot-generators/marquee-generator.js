// file marquee.js

import Jimp from "jimp";
import fs from "fs";
import path from "path";

class MarqueeGenerator {
  constructor(config) {
    this.config = {
      width: 1400,
      height: 560,
      logoSize: 100,
      canvasPadding: 70,
      fontPadding: 20,
      buttonPadding: 60,
      buttonHeight: 80,
      buttonBottomMargin: 50,
      attributesTopMargin: 140,
      attributesChipHeight: 40,
      attributesChipPadding: 30,
      attributesChipMargin: 10,
      attributesMaxWidth: 0.8,
      ...config,
    };
  }

  async createCanvas(background, tint) {
    let image;

    if (typeof background === "string" && background.endsWith(".png")) {
      if (!fs.existsSync(background)) {
        throw new Error("Background file does not exist.");
      }
      image = await Jimp.read(background);
      image.cover(this.config.width, this.config.height);
      if (tint) {
        image.color([{ apply: tint, params: [50] }]);
      }
    } else {
      image = new Jimp(this.config.width, this.config.height, background);
    }
    return image;
  }

  async loadLogo(logoPath, size = this.config.logoSize) {
    if (!fs.existsSync(logoPath)) {
      throw new Error("Logo file does not exist.");
    }
    const logo = await Jimp.read(logoPath);
    await logo.resize(size, size);
    return logo;
  }

  calculateTextColor(image) {
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
      chipColor: brightness > 0.5 ? "white" : "black",
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
        Jimp[`FONT_SANS_64_${textColor.toUpperCase()}`],
      ),
      descFont: await Jimp.loadFont(
        Jimp[`FONT_SANS_32_${textColor.toUpperCase()}`],
      ),
      attributesFont: await Jimp.loadFont(
        Jimp[`FONT_SANS_32_${textColor.toUpperCase()}`],
      ),
      buttonFont: await Jimp.loadFont(
        Jimp[`FONT_SANS_64_${textColor.toUpperCase()}`],
      ),
    };
  }

  renderAttributes(canvas, attributes, attributesFont, startX, startY, style) {
    let attributesY = startY + 140; // Position attributes under the description
    let chipHeight = 40; // Increased chip height for larger font

    const getStartX = (attrs) => {
      if (style !== 2) {
        return startX;
      }

      let newStartX;
      const textWidth =
        Jimp.measureText(attributesFont, attrs.join(" ")) + 30 * attrs.length;
      if (textWidth > canvas.bitmap.width) {
        newStartX = this.config.canvasPadding + 30;
      } else {
        newStartX = (canvas.bitmap.width - textWidth) / 2;
      }
      return newStartX;
    };
    // startX = getStartX(attributes);

    let chipX = getStartX(attributes);
    for (let i = 0; i < attributes.length; i++) {
      const attribute = attributes[i];
      const measureText = Jimp.measureText(attributesFont, attribute);
      const chipWidth = measureText + 30; // Padding for the chip
      if (chipX + chipWidth > canvas.bitmap.width - 20) {
        // Check if chip overflows the image width
        // startX = getStartX(attributes.slice(i));
        chipX = getStartX(attributes.slice(i)); // Reset to first position in line
        attributesY += chipHeight + 10; // Move to next line
      }
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
  }

  renderButton(canvas, callToAction, buttonFont, buttonColor, style) {
    const buttonWidth =
      Jimp.measureText(buttonFont, callToAction) + this.config.buttonPadding;
    let buttonX;
    let buttonY =
      canvas.bitmap.height -
      this.config.buttonHeight -
      this.config.buttonBottomMargin;

    if (style === 1 || style === 2) {
      buttonX = (canvas.bitmap.width - buttonWidth) / 2;
    } else if (style === 3) {
      buttonX = this.config.canvasPadding;
    }

    canvas.scan(
      buttonX + 5,
      buttonY + 5,
      buttonWidth,
      this.config.buttonHeight,
      (x, y, idx) => {
        canvas.bitmap.data[idx + 0] = 0;
        canvas.bitmap.data[idx + 1] = 0;
        canvas.bitmap.data[idx + 2] = 0;
        canvas.bitmap.data[idx + 3] = 95;
      },
    );

    canvas.scan(
      buttonX,
      buttonY,
      buttonWidth,
      this.config.buttonHeight,
      (x, y, idx) => {
        canvas.bitmap.data[idx + 0] = (buttonColor >> 24) & 255;
        canvas.bitmap.data[idx + 1] = (buttonColor >> 16) & 255;
        canvas.bitmap.data[idx + 2] = (buttonColor >> 8) & 255;
        canvas.bitmap.data[idx + 3] = 255;
      },
    );
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
      this.config.buttonHeight,
    );
  }

  renderComponents(
    canvas,
    logo,
    extensionName,
    description,
    attributes,
    callToAction,
    fonts,
    colors,
    style,
  ) {
    const { titleFont, descFont, attributesFont, buttonFont } = fonts;
    const callToActionHeight = callToAction ? 50 : 0;
    const hasAttributes =
      attributes !== undefined && attributes !== null && attributes.length > 0;
    const attributesHeight = hasAttributes ? 60 : 0;
    let verticalAdjustment = callToActionHeight;
    if (hasAttributes) {
      // Attributes don't affect height in style 1.
      verticalAdjustment += attributesHeight;
    }

    let logoX, logoY;
    let textX, textY;
    let descX, descY;

    if (style === 1) {
      logoX = this.config.canvasPadding;
      logoY =
        (canvas.bitmap.height - logo.bitmap.height) / 2 -
        (verticalAdjustment - attributesHeight);
      textX = logoX + logo.bitmap.width + 30;
      textY =
        (canvas.bitmap.height -
          Jimp.measureTextHeight(titleFont, extensionName)) /
          2 -
        30 -
        verticalAdjustment;
      descX = logoX + logo.bitmap.width + 30;
      descY = textY + 80;
    } else if (style === 2) {
      logoX = (canvas.bitmap.width - logo.bitmap.width) / 2;
      logoY = 150 - verticalAdjustment;
      textX =
        (canvas.bitmap.width - Jimp.measureText(titleFont, extensionName)) / 2;
      textY = logoY + logo.bitmap.height + 30;
      descX =
        (canvas.bitmap.width - Jimp.measureText(descFont, description)) / 2;
      descY = textY + 80;
    } else if (style === 3) {
      logoX = this.config.canvasPadding;
      logoY = 150 - verticalAdjustment;
      textX = this.config.canvasPadding;
      textY = logoY + logo.bitmap.height + 30;
      descX = this.config.canvasPadding;
      descY = textY + 80;
    }

    canvas.composite(logo, logoX, logoY);
    canvas.print(
      titleFont,
      textX,
      textY,
      extensionName,
      canvas.bitmap.width - textX - this.config.fontPadding,
    );
    canvas.print(
      descFont,
      descX,
      descY,
      description,
      canvas.bitmap.width - textX - this.config.fontPadding,
    );

    if (hasAttributes) {
      this.renderAttributes(
        canvas,
        attributes,
        attributesFont,
        textX,
        textY,
        style,
      );
    }
    if (callToAction) {
      this.renderButton(
        canvas,
        callToAction,
        buttonFont,
        colors.buttonColor,
        style,
      );
    }
  }

  getExtensionDetails(extensionDir) {
    const manifestPath = path.join(extensionDir, "manifest.json");
    if (!fs.existsSync(manifestPath)) {
      throw new Error("Manifest file does not exist.");
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    let extensionName = manifest.name;
    let description = manifest.description;

    if (manifest.default_locale) {
      const localesDir = path.join(extensionDir, "_locales");
      if (fs.existsSync(localesDir)) {
        const localePath = path.join(
          localesDir,
          manifest.default_locale,
          "messages.json",
        );
        if (fs.existsSync(localePath)) {
          const localeMessages = JSON.parse(
            fs.readFileSync(localePath, "utf8"),
          );
          const nameKey = manifest.name.split("_MSG_").pop().replace("__", "");
          const descKey = manifest.description
            .split("_MSG_")
            .pop()
            .replace("__", "");
          extensionName = localeMessages[nameKey].message;
          description = localeMessages[descKey].message;
        } else {
          console.error(`Locale file ${localePath} does not exist.`);
          return;
        }
      } else {
        console.error(`Locales directory ${localesDir} does not exist.`);
        return;
      }
    }

    let logoPath = "";
    if (manifest.icons) {
      const iconSizes = Object.keys(manifest.icons).map(Number);
      const maxSize = Math.max(...iconSizes);
      logoPath = path.join(extensionDir, manifest.icons[maxSize.toString()]);
    }

    return {
      extensionName,
      description,
      logoPath,
    };
  }

  async createPromotionalImage({
    extensionDir,
    attributes,
    callToAction,
    background,
    backgroundTint,
    style = 1,
    outputPath,
  }) {
    try {
      const { extensionName, description, logoPath } =
        this.getExtensionDetails(extensionDir);
      const canvas = await this.createCanvas(background, backgroundTint);
      const logo = await this.loadLogo(logoPath, style === 1 ? 250 : 100);
      const colors = this.calculateTextColor(canvas);
      const fonts = await this.loadFonts(colors.textColor);

      this.renderComponents(
        canvas,
        logo,
        extensionName,
        description,
        attributes,
        callToAction,
        fonts,
        colors,
        style,
      );

      await canvas.writeAsync(outputPath);
      console.log("Promotional image created successfully:", outputPath);
    } catch (error) {
      console.error("Error creating promotional image:", error);
    }
  }
}

// Example usage
const generator = new MarqueeGenerator();
generator.createPromotionalImage({
  extensionDir: "../../../calculator/build/chrome-dev",
  background: "#123456",
  attributes: [
    "fast",
    "shortcut support",
    "secure",
    "draggable",
    "automatic preview",
    "hover trigger",
    "multiple search engines",
  ],
  callToAction: "Try it out",
  style: 1,
  outputPath: "marquee1.png",
});

generator.createPromotionalImage({
  extensionDir: "../../../calculator/build/chrome-dev",
  background: "#123456",
  attributes: [
    "fast",
    "shortcut support",
    "secure",
    "draggable",
    "automatic preview",
    "hover trigger",
    "multiple search engines",
  ],
  callToAction: "Try it out",
  style: 2,
  outputPath: "marquee2.png",
});
generator.createPromotionalImage({
  extensionDir: "../../../calculator/build/chrome-dev",
  background: "#123456",
  attributes: [
    "fast",
    "shortcut support",
    "secure",
    "draggable",
    "automatic preview",
    "hover trigger",
    "multiple search engines",
  ],
  callToAction: "Try it out",
  style: 3,
  outputPath: "marquee3.png",
});
