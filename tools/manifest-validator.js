import fs from "fs";
import path from "path";
import { glob } from "glob";
import { validatePermissions } from "./permission-checker.js";
import { BrowserCompatibilityAnalyzer } from "./compat-checker.js";

export class ManifestValidator {
  constructor(basePath, browser) {
    this.basePath = basePath;
    this.browser = browser;
    this.manifestPath = path.join(basePath, "manifest.json");
    this.manifest = {};
  }

  loadManifest() {
    try {
      const data = fs.readFileSync(this.manifestPath, "utf8");
      this.manifest = JSON.parse(data);
      return { message: "Load Manifest", status: "PASS" };
    } catch (error) {
      return { message: "Load Manifest", status: "FAIL", error: error };
    }
  }

  validateFilePaths() {
    try {
      const allPaths = [
        ...(this.manifest.icons ? Object.values(this.manifest.icons) : []),
        ...(this.manifest.content_scripts
          ? this.manifest.content_scripts
              .map((cs) => [cs.js, cs.css].flat())
              .flat()
          : []),
        ...(this.manifest.action
          ? Object.values(this.manifest.action.default_icon)
          : []),
        ...(this.manifest.action.default_popup
          ? [this.manifest.action.default_popup]
          : []),
        ...(this.manifest.side_panel
          ? [this.manifest.side_panel.default_path]
          : []),
        ...(this.manifest.options_page ? [this.manifest.options_page] : []),
        ...(this.manifest.background
          ? Object.values(this.manifest.background)
          : []),
        ...(this.manifest.web_accessible_resources
          ? this.manifest.web_accessible_resources
              .map((r) => r.resources)
              .flat()
          : []),
      ];
      allPaths.forEach((file) => {
        if (!fs.existsSync(path.join(this.basePath, file))) {
          throw new Error(`File not found: ${file}`);
        }
      });
      return { message: "File paths validation", status: "PASS" };
    } catch (error) {
      return { message: "File paths validation", status: "FAIL", error: error };
    }
  }

  validateLocales() {
    try {
      if (this.manifest.default_locale) {
        const localesPath = path.join(this.basePath, "_locales");
        if (!fs.existsSync(localesPath)) {
          throw new Error(
            "Locales directory does not exist but default_locale is set."
          );
        }
        const localeDir = path.join(localesPath, this.manifest.default_locale);
        if (!fs.existsSync(localeDir)) {
          throw new Error(
            `Locale directory ${localeDir} for default_locale does not exist.`
          );
        }
        return { message: "Locales validation", status: "PASS" };
      } else {
        throw new Error("default_locale necessary for i18n is not set.");
      }
    } catch (error) {
      return { message: "Locales validation", status: "FAIL", error: error };
    }

    // TODO: validaate that i18n keys are defined, properly in format __MSG_[key]__
  }

  validateVersion() {
    try {
      if (/\b0\d+\b/.test(this.manifest.version)) {
        throw new Error(
          `Manifest version ${this.manifest.version} cannot have a preceding zero in any of its parts.`
        );
      }
      return { message: "Version format validation", status: "PASS" };
    } catch (error) {
      return {
        message: "Version format validation",
        status: "FAIL",
        error: error,
      };
    }
  }

  async validateMinimumBrowserVersion() {
    try {
      if (!this.manifest[`minimum_${this.browser}_version`]) {
        throw new Error(
          `minimum_${this.browser}_version is not set in the manifest.json file.`
        );
      }

      await new BrowserCompatibilityAnalyzer(
        this.basePath,
        this.browser
      ).analyze();

      return { message: "Browser compat", status: "PASS" };
    } catch (error) {
      return {
        message: "Browser compat",
        status: "FAIL",
        error: error,
      };
    }
  }

  validateIcons() {
    try {
      if (this.manifest.icons) {
        Object.keys(this.manifest.icons).forEach((size) => {
          const iconPath = path.join(this.basePath, this.manifest.icons[size]);
          if (!fs.existsSync(iconPath)) {
            throw new Error(`Icon file for size ${size} does not exist.`);
          }
          // Additional image size verification can be added here
        });

        // Check if all required sizes are present.
        const requiredSizes = ["16", "32", "48", "128"];
        requiredSizes.forEach((size) => {
          if (!this.manifest.icons[size]) {
            throw new Error(`Icon size ${size} is missing.`);
          }
        });
      }
      return { message: "Icons validation", status: "PASS" };
    } catch (error) {
      return { message: "Icons validation", status: "FAIL", error: error };
    }
  }

  validateShortName() {
    try {
      const shortName = this.manifest.short_name;
      if (!shortName) {
        return { message: "Short name validation", status: "PASS" };
      }

      if (!shortName.startsWith("__MSG_") && shortName.length > 12) {
        throw new Error("Short name must be less than 12 characters.");
      }

      if (shortName.startsWith("__MSG_")) {
        const localeKey = shortName.replace("__MSG_", "").replace("__", "");
        const localeMessage = this.getDefaultLocaleMessage(localeKey);
        if (localeMessage.length > 12) {
          throw new Error("Short name must be less than 12 characters.");
        } else {
          return { message: "Short name validation", status: "PASS" };
        }
      }
    } catch (error) {
      return { message: "Short name validation", status: "FAIL", error: error };
    }
  }

  getDefaultLocaleMessage(localeKey) {
    if (!this.manifest.default_locale) {
      throw new Error(`default_locale is not set.`);
    }
    const localeDir = path.join(
      this.basePath,
      "_locales",
      this.manifest.default_locale
    );
    const localeFile = path.join(localeDir, "messages.json");
    if (!fs.existsSync(localeFile)) {
      throw new Error(
        `Locale file ${localeFile} for default_locale does not exist.`
      );
    }
    const localeData = JSON.parse(fs.readFileSync(localeFile, "utf8"));
    if (!localeData[localeKey]) {
      throw new Error(
        `Locale key ${localeKey} does not exist in ${localeFile}.`
      );
    }
    return localeData[localeKey].message;
  }

  async runAllValidations() {
    const jsFiles = glob.sync("**/*.+(js|ts)", { cwd: this.basePath });
    const results = [
      this.loadManifest(),
      this.validateFilePaths(),
      this.validateLocales(),
      this.validateVersion(),
      await this.validateMinimumBrowserVersion(),
      validatePermissions(
        this.basePath,
        jsFiles,
        this.manifest.permissions,
        this.manifest.optional_permissions ?? []
      ),
      this.validateIcons(),
      this.validateShortName(),
      // TODO: Ensure that uninstall URL is set.
    ];
    results.forEach((result) => {
      console.log(
        `${result.message.padEnd(30, ".")}${result.status.padStart(5)} ${
          result.error ? result.error : ""
        }`
      );
    });

    const hasFailedValidation = results.find(
      (result) => result.status === "FAIL"
    );
    if (hasFailedValidation) {
      throw new Error(
        "Manifest validation failed: " +
          hasFailedValidation.message +
          ": " +
          hasFailedValidation.error
      );
    }
  }
}
