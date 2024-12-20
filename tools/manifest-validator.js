import fs from "fs";
import path from "path";

// chrome permissions list from https://developer.chrome.com/docs/extensions/reference/permissions-list
const VALID_PERMISSIONS = [
  "accessibilityFeatures.modify",
  "accessibilityFeatures.read",
  "activeTab",
  "alarms",
  "audio",
  "background",
  "bookmarks",
  "browsingData",
  "certificateProvider",
  "clipboardRead",
  "clipboardWrite",
  "contentSettings",
  "contextMenus",
  "cookies",
  "debugger",
  "declarativeContent",
  "declarativeNetRequest",
  "declarativeNetRequestWithHostAccess",
  "declarativeNetRequestFeedback",
  "dns",
  "desktopCapture",
  "documentScan",
  "downloads",
  "downloads.open",
  "downloads.ui",
  "enterprise.deviceAttributes",
  "enterprise.hardwarePlatform",
  "enterprise.networkingAttributes",
  "enterprise.platformKeys",
  "favicon",
  "fileBrowserHandler",
  "fileSystemProvider",
  "fontSettings",
  "gcm",
  "geolocation",
  "history",
  "identity",
  "identity.email",
  "idle",
  "loginState",
  "management",
  "nativeMessaging",
  "notifications",
  "offscreen",
  "pageCapture",
  "platformKeys",
  "power",
  "printerProvider",
  "printing",
  "printingMetrics",
  "privacy",
  "processes",
  "proxy",
  "readingList",
  "runtime",
  "scripting",
  "search",
  "sessions",
  "sidePanel",
  "storage",
  "system.cpu",
  "system.display",
  "system.memory",
  "system.storage",
  "tabCapture",
  "tabGroups",
  "tabs",
  "topSites",
  "tts",
  "ttsEngine",
  "unlimitedStorage",
  "vpnProvider",
  "wallpaper",
  "webAuthenticationProxy",
  "webNavigation",
  "webRequest",
  "webRequestBlocking",
];

export class ManifestValidator {
  constructor(basePath) {
    this.basePath = basePath;
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
            "Locales directory does not exist but default_locale is set.",
          );
        }
        const localeDir = path.join(localesPath, this.manifest.default_locale);
        if (!fs.existsSync(localeDir)) {
          throw new Error(
            `Locale directory ${localeDir} for default_locale does not exist.`,
          );
        }
        return { message: "Locales validation", status: "PASS" };
      } else {
        throw new Error("default_locale necessary for i18n is not set.");
      }
    } catch (error) {
      return { message: "Locales validation", status: "FAIL", error: error };
    }
  }

  validateVersion() {
    try {
      if (/^0[0-9]+/.test(this.manifest.version)) {
        throw new Error("Version number cannot have a preceding zero.");
      }
      return { message: "Version format validation", status: "PASS" };
    } catch (error) {
      return { message: "Version format validation", status: "FAIL" };
    }
  }

  validatePermissions() {
    try {
      if (this.manifest.permissions) {
        this.manifest.permissions.forEach((permission) => {
          if (!VALID_PERMISSIONS.includes(permission)) {
            throw new Error(`Invalid permission: ${permission}`);
          }
        });
      }
      return { message: "Permissions validation", status: "PASS" };
    } catch (error) {
      return {
        message: "Permissions validation",
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
      if (this.manifest.short_name && this.manifest.short_name.length > 12) {
        throw new Error("Short name must be less than 12 characters.");
      }
      return { message: "Short name validation", status: "PASS" };
    } catch (error) {
      return { message: "Short name validation", status: "FAIL", error: error };
    }
  }

  runAllValidations() {
    const results = [
      this.loadManifest(),
      this.validateFilePaths(),
      this.validateLocales(),
      this.validateVersion(),
      this.validatePermissions(),
      this.validateIcons(),
      this.validateShortName(),
    ];
    results.forEach((result) => {
      console.log(
        `${result.message.padEnd(30, ".")}${result.status.padStart(5)} ${
          result.error ? result.error : ""
        }`,
      );
    });
  }
}
