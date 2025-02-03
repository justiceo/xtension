import fs from "fs";
import path from "path";
import { glob } from "glob";
import browserCompatData from "@mdn/browser-compat-data" with { type: "json" };

/**
 * Analyzes the compatibility of a browser extension against
 * MDN's WebExtensions compatibility data.
 *
 * This code only checks the WebExtensions API described here - https://github.com/mdn/browser-compat-data/tree/main/webextensions/api
 * TODO: Implement manifest compatibility checks from https://github.com/mdn/browser-compat-data/tree/main/webextensions/manifest
 *
 * Always set minimum supported versions for each browser in the manifest.
 * The exact number you choose is not as important as there being a number at all.
 * The compatibility checker will tell you if you are using an API that is not supported in the specified version anyway.
 * Also it would be better to increase the minimum supported version than to change the use of an API in order to preserve it.
 * All browsers have automatic updates, so in no time, the minimum supported version will be reaching >95% of users.
 */
export class BrowserCompatibilityAnalyzer {
  compatOverrides = {
    "chrome.runtime.setUninstallURL": 41, // Limits URL to 255 characters.
    "chrome.storage.session": 102, // Limits session storage to 1MB.
  };

  constructor(extensionDirectory, browser = "chrome") {
    this.extensionDirectory = extensionDirectory;
    this.browser = browser;
    this.chromeApi = browserCompatData.webextensions.api;
    this.minBrowserVersion = this.getMinBrowserVersion(
      extensionDirectory,
      browser
    );
    this.files = this.getJavaScriptFiles();
  }

  getMinBrowserVersion(outDir, browser) {
    try {
      const manifestPath = path.join(outDir, "manifest.json");
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
      const minVersion = manifest[`minimum_${browser}_version`];
      if (minVersion) {
        return parseInt(minVersion, 10);
      } else {
        return 0; // All browser versions are supported.
      }
    } catch (error) {
      console.error("Error loading or parsing manifest.json:", error);
      return {};
    }
  }

  getJavaScriptFiles() {
    return glob.sync("**/*.+(js|ts)", { cwd: this.extensionDirectory });
  }

  async analyze() {
    const violations = {};

    for (const file of this.files) {
      const code = await this.readFile(
        path.join(this.extensionDirectory, file)
      );
      if (code) {
        const apiCalls = this.findChromeAPICalls(code);
        try {
          this.checkCompatibility(apiCalls, file, violations, this.browser);
        } catch (error) {
          throw Error(`Error checking compatibility for ${file}:${error}`);
        }
      }
    }

    const violationsArr = Object.values(violations);
    // Find violation with max required version
    const violation = violationsArr.reduce(
      (max, v) => (max.required_version > v.required_version ? max : v),
      violationsArr[0]
    );

    if (violation) {
      console.error(
        `[${violation.api}] requires version ${violation.required_version} or later.`
      );
      console.debug("Support info:", violation.support_info);

      console.log(`Found in ${violation.occurrences.length} places:`);
      const occurences =
        "    " +
        violation.occurrences
          .map((occurrence) => occurrence.location)
          .join("\n    ");
      console.log(occurences, "\n");

      throw Error(
        `[${violation.api}] requires version ${violation.required_version} or later.`
      );
    }
  }

  async readFile(file) {
    try {
      return fs.readFileSync(file, "utf8");
    } catch (error) {
      console.error(`Error reading ${file}:`, error);
      return null;
    }
  }

  findChromeAPICalls(codeText) {
    const regex = /chrome\.\w+\.\w+(\(.*?\))?/g;
    const lines = codeText.split("\n");
    const results = [];

    lines.forEach((line, index) => {
      let match;
      while ((match = regex.exec(line)) !== null) {
        results.push({
          symbol: match[0].split("(")[0],
          match: match[0],
          line: index + 1,
        });
      }
    });

    return results;
  }

  getCompatData(apiName) {
    const symbols = apiName.split(".");
    symbols.shift(); // Remove "chrome"
    let data = this.chromeApi;
    for (const symbol of symbols) {
      if (!data) {
        return null;
      }
      data = data[symbol];
    }
    return data ? data.__compat : null;
  }

  checkCompatibility(apiCalls, file, violations, browser) {
    apiCalls.forEach((call) => {
      const apiData = this.getCompatData(call.symbol);
      if (!apiData) {
        return;
      }
      const supportInfos = apiData.support[browser];
      if (!supportInfos) return;
      let latestVersion, latestSupportInfo;
      if (Array.isArray(supportInfos)) {
        latestVersion = Math.max(...supportInfos.map((s) => s.version_added));
        latestSupportInfo = supportInfos.find(
          (s) => s.version_added === "" + latestVersion
        );
      } else {
        latestVersion = supportInfos.version_added;
        latestSupportInfo = supportInfos;
      }
      let versionAdded = latestSupportInfo.version_added;

      if (versionAdded === true) return;
      versionAdded = parseInt(versionAdded, 10);
      if (isNaN(versionAdded)) return;
      const overriddenVersion = this.compatOverrides[call.symbol];
      const supported = overriddenVersion
        ? overriddenVersion <= this.minBrowserVersion
        : versionAdded <= this.minBrowserVersion;

      if (!supported) {
        const violationKey = `${browser}:${call.symbol}`;
        if (!violations[violationKey]) {
          violations[violationKey] = {
            browser,
            api: call.symbol,
            required_version: versionAdded,
            support_info: supportInfos,
            occurrences: [],
          };
        }
        violations[violationKey].occurrences.push({
          location: `${file}:${call.line}`,
          match: call.match,
        });
      }
    });
  }
}
