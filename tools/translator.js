// This script generates translated versions of an original locale for i18n purposes.
// To run: node tools/text-translator.js
import { readFileSync, existsSync, mkdirSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import translate from "google-translate-api-x";
import { glob } from "glob";
import { JSDOM } from "jsdom";

// See full list of supported locales here - https://developer.chrome.com/docs/webstore/i18n/#choosing-locales-to-support
// The following locales are currently omitted: fil.
// The locales pt-BR and pt-PT are reduced to pt.
const targetLocales = [
  "ar",
  "am",
  "bg",
  "bn",
  "ca",
  "cs",
  "da",
  "de",
  "el",
  "en",
  "es",
  "et",
  "fa",
  "fi",
  "fr",
  "gu",
  "he",
  "hi",
  "hr",
  "hu",
  "id",
  "it",
  "ja",
  "kn",
  "ko",
  "lt",
  "lv",
  "ml",
  "mr",
  "ms",
  "ml",
  "no",
  "pl",
  "pt",
  "ro",
  "ru",
  "sk",
  "sl",
  "sr",
  "sv",
  "sw",
  "ta",
  "te",
  "th",
  "tr",
  "uk",
  "vi",
  "zh-CN",
  "zh-TW",
];

/**
 * Translate the text for a chrome extension to all the supported chrome locales.
 * The input is the source directory of the extension.
 * The extension assumes the present of both manifest.json and _locales directory at the root of the source directory.
 * The manifest.json should also have a `default_locale` key, which is required for i18n support in Chrome.
 */
export class Translator {
  srcDir;
  localesDir;
  manifestPath;
  manifest;
  defaultLocale;
  localeFilename = "messages.json"; // The filename for the locale files must be named messages.json

  constructor(srcDir) {
    this.srcDir = srcDir;
    this.localesDir = join(srcDir, "_locales");
    this.manifestPath = join(srcDir, "manifest.json");
    const manifest = JSON.parse(readFileSync(this.manifestPath, "utf8"));
    if (!manifest.default_locale) {
      throw new Error("Default locale not found in manifest.json");
    }
    this.defaultLocale = manifest.default_locale;
  }

  // Function to get the path to a locale file
  getLocaleFile(locale) {
    return `${this.localesDir}/${locale.replace("-", "_")}/${
      this.localeFilename
    }`;
  }

  // Function to read and parse the source locale data
  getDefaultLocaleData() {
    const rawdata = readFileSync(this.getLocaleFile(this.defaultLocale));
    return JSON.parse(rawdata);
  }

  // Function to ensure directory existence
  ensureDirectoryExistence(filePath) {
    const dir = dirname(filePath);
    if (existsSync(dir)) {
      return;
    }
    this.ensureDirectoryExistence(dir);
    mkdirSync(dir);
  }

  // Function to apply translation to locale data and save it
  applyTranslation(targetLocale, localeData, sourceLocaleData) {
    const targetLocaleClone = structuredClone(sourceLocaleData);
    Object.keys(localeData).forEach((key) => {
      targetLocaleClone[key]["message"] = localeData[key]["text"];
      if (
        localeData[key].from?.language?.didYouMean &&
        localeData[key].from.language.iso !== this.defaultLocale
      ) {
        console.warn(
          `Auto corrected source locale from ${this.defaultLocale} to ${localeData[key].from.language.iso} `
        );
      }
      if (
        localeData[key].from?.text?.didYouMean ||
        localeData[key].from?.text?.autoCorrected
      ) {
        console.warn(
          `Auto corrected text to ${localeData[key].from?.text?.value}`
        );
      }
    });

    this.ensureDirectoryExistence(this.getLocaleFile(targetLocale));
    const formattedData = JSON.stringify(targetLocaleClone, null, 4);
    console.log("Updated: ", this.getLocaleFile(targetLocale));
    writeFileSync(this.getLocaleFile(targetLocale), formattedData, {
      flag: "w",
    });
  }

  // Function to search and return a matching regex in a file.
  searchInFile(filePath, regex) {
    const content = readFileSync(filePath, "utf8");
    const allMatches = [];
    let matches;

    while ((matches = regex.exec(content)) !== null) {
      // This will push the first captured group (the content inside quotes) into allMatches
      if (matches[1]) {
        allMatches.push(matches[1]);
      }
    }

    return allMatches;
  }

  // Loops through .ts and .js files and extracts i18n literals.
  searchForI18nStrings(srcDirectory) {
    return new Promise(async (resolve, reject) => {
      // Regex to capture content inside quotes without including the quotes
      // TODO: Verify it works for new lines (for long texts).
      const regex = /i18n\(\s*(?:"([\s\S]*?)"|'([\s\S]*?)')\s*,?\s*\)/g;
      const filesPattern = join(srcDirectory, "**", "*.{ts,js}");
      const files = await glob(filesPattern);

      const allMatches = files.reduce((acc, filePath) => {
        const matches = this.searchInFile(filePath, regex);
        if (matches.length > 0) {
          acc[filePath] = matches;
        }
        return acc;
      }, {});

      let literals = Object.values(allMatches).reduce(
        (acc, currentValue) => acc.concat(currentValue),
        []
      );
      literals = literals.filter((f) => !f.startsWith("const_")); // exclude special messages.
      resolve(literals);
    });
  }

  // Map the literals to a valid manifest key.
  // If this function is modified, also update it in src/utils/i18n.ts
  encodeString(input) {
    // Define the allowed characters: a-z, A-Z, 0-9, and _
    const allowedCharacters = /^[a-zA-Z0-9_]+$/;

    // Split the input into an array of characters, transform each character,
    // and then join the array back into a string
    return input
      .split("")
      .map((char) => {
        // If the character matches the allowed characters, return it as is;
        // otherwise, return '_'
        return allowedCharacters.test(char) ? char : "_";
      })
      .join("");
  }

  // Maps the literals to an object, where the key is an encoded version of the literal and the value is the literal itself.
  mapLiteralsToEncodedObject(literals) {
    return literals.reduce((acc, literal) => {
      acc[this.encodeString(literal)] = { message: literal };
      return acc;
    }, {});
  }

  parseHTMLFiles(src) {
    return new Promise(async (resolve, reject) => {
      // Map to hold the i18n attribute value to innerHTML
      const i18nMap = {};

      // Fetch all HTML files in the given src directory
      const files = await glob(`${src}/**/*.html`);

      files.forEach((file) => {
        // Read the content of each HTML file
        const htmlContent = readFileSync(file, "utf8");
        const dom = new JSDOM(htmlContent);
        const document = dom.window.document;

        // Query all elements with the i18n attribute
        const elements = document.querySelectorAll("[i18n]");

        elements.forEach((el) => {
          // Ignore elements with i18n attribute.
          const i18nValue = el.getAttribute("i18n");
          if (i18nValue) {
            return;
          }

          // Encode the innerHTML as key
          const innerHTML = el.innerHTML.toString();
          const key = this.encodeString(innerHTML.trim());
          i18nMap[key] = { message: innerHTML };
        });
      });

      resolve(i18nMap);
    });
  }

  // Main function to generate translations
  async generateTranslations() {
    let defaultLocaleData = this.getDefaultLocaleData();
    // Remove all the messages that are not prefixed with const_, they'll be added as literals.
    Object.keys(defaultLocaleData).forEach((key) => {
      if (!key.startsWith("const_")) {
        delete defaultLocaleData[key];
      }
    });

    // Get the literals from Js/TS files
    const codeLiterals = await this.searchForI18nStrings(this.srcDir);
    // combine sourceLocaleData and mappedLiterals into one object.
    defaultLocaleData = Object.assign(
      defaultLocaleData,
      this.mapLiteralsToEncodedObject(codeLiterals)
    );

    // Get the literals from HTML files
    const htmlLiterals = await this.parseHTMLFiles(this.srcDir);
    // combine htmlLiterals into sourceLocaleData
    defaultLocaleData = Object.assign(defaultLocaleData, htmlLiterals);

    const messageRequest = Object.keys(defaultLocaleData).reduce((acc, key) => {
      acc[key] = defaultLocaleData[key]["message"];
      return acc;
    }, {});
    console.log("Translation request", messageRequest);

    try {
      await Promise.all(
        targetLocales.map(async (targetLocale) => {
          const res = await translate(messageRequest, {
            from: this.defaultLocale,
            to: targetLocale,
          });
          this.applyTranslation(targetLocale, res, defaultLocaleData);
        })
      );

      console.log("All translate futures have resolved");
    } catch (err) {
      console.error("Some futures failed: ", err);
    }
  }
}

/* Regex will match the fololowing cases:

i18n("hello")
i18n('hi')
i18n("const_he")
i18n("sdf;'")
i18n("")
i18n(
"hello world"
)
i18n(
"hello world
and the begening of the end"
)

i18n(
"hello world" +
"and the begening of the end"
)

i18n(
"hello world
and the begening of the end",
)

i18n("hello world".replace("Hello"))
i18n("hello world" + " again")
*/
