import fs from "fs";
import path from "path";
import { glob } from "glob";
import browserCompatData from "@mdn/browser-compat-data" assert { type: "json" };

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
  constructor(extensionDirectory) {
    this.extensionDirectory = extensionDirectory;
    this.chromeApi = browserCompatData.webextensions.api;
    this.browsers = this.loadManifestBrowserInfo();
    this.files = this.getJavaScriptFiles();
  }

  loadManifestBrowserInfo() {
    try {
      const manifestPath = path.join(this.extensionDirectory, "manifest.json");
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
      // TODO: Update this table with browsers from args and support prefix like __chrome__.
      return {
        chrome: manifest.minimum_chrome_version,
        firefox: manifest.minimum_firefox_version,
      };
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
        path.join(this.extensionDirectory, file),
      );
      if (code) {
        const apiCalls = this.findChromeAPICalls(code);
        this.checkCompatibility(apiCalls, file, violations);
      }
    }

    Object.keys(violations).map((violationKey) => {
      const violation = violations[violationKey];
      console.log(
        `[${violation.browser}]: ${violation.api} requires version ${violation.required_version} or later.`,
      );

      let notes = "";
      if (violation.support_info) {
        if (Array.isArray(violation.support_info)) {
          notes = violation.support_info[0].notes;
        } else {
          notes = violation.support_info.notes;
        }
      }
      if (notes) {
        console.log("Notes:", notes);
      }
      console.debug("Support info:", violation.support_info)

      console.log(`Found in ${violation.occurrences.length} places:`);
      const occurences =
        "    " +
        violation.occurrences
          .map((occurrence) => occurrence.location + "\t" + occurrence.match)
          .join("\n    ");
      console.log(occurences, "\n");
    });
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
    return data.__compat;
  }

  checkCompatibility(apiCalls, file, violations) {
    apiCalls.forEach((call) => {
      const apiData = this.getCompatData(call.symbol);
      if (apiData) {
        for (const browser in this.browsers) {
          const version = parseInt(this.browsers[browser], 10);
          const supportInfos = apiData.support[browser];
          if (!supportInfos) continue;
          let latestVersion, latestSupportInfo;
          if (Array.isArray(supportInfos)) {
            latestVersion = Math.max(...supportInfos.map((s) => s.version_added));
            latestSupportInfo = supportInfos.find((s) => s.version_added === "" + latestVersion);
          } else {
            latestVersion = supportInfos.version_added;
            latestSupportInfo = supportInfos;
          }
          let versionAdded = latestSupportInfo.version_added;
          
          if (versionAdded === true) continue;
          versionAdded = parseInt(versionAdded, 10);
          if (isNaN(versionAdded)) continue;
          const supported = versionAdded <= version;

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
        }
      }
    });
  }
}
