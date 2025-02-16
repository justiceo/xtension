import fs from "fs";
import path from "path";
import { exec } from "child_process";
import esbuild from "esbuild";
import Jasmine from "jasmine";
import puppeteer from "puppeteer";
import { parse } from "./parse.js";
import manifest from "../src/manifest.json" with { type: "json" };
import { Translator } from "./translator.js";
import { ImageResizer } from "./image-resizer.js";
import { ManifestValidator } from "./manifest-validator.js";
import { ChromeExtensionDownloader } from "./downloader.js";
import { BrowserCompatibilityAnalyzer } from "./compat-checker.js";
import { StorePublisher } from "./publisher.js";

class Build {
  outputBase = "build";
  browser = "chrome";
  isProd = false;
  outDir = "build/chrome-dev";
  srcDir = "src";
  args;

  // If a spec is in TS, specify the path to the both ts and js versions.
  tsSpecs = ["spec/lib/i18n-spec.ts"];
  testSpecs = ["spec/out/i18n-spec.js", "spec/e2e/e2e-spec.js"];
  originalIconPath = "src/assets/images/logo.png";

  constructor() {
    const args = parse(process.argv);
    this.args = args;

    if (args.output_base) {
      this.outputBase = args.output_base;
    }

    if (args.prod) {
      this.isProd = true;
    }

    // Ensure browser is lowercase.
    if (args.browser) {
      this.browser = args.browser.toLowerCase();
    }

    // Set the source directory
    this.srcDir = args.src ?? this.srcDir;

    // Set the output directory
    this.outDir = `${this.outputBase}/${this.browser}-${
      this.isProd ? "prod" : "dev"
    }/`;

    switch (args.task) {
      case "start":
        this.launchBrowser();
        break;
      case "watch":
        this.watch();
        break;
      case "test":
        this.test();
        break;
      case "build":
        this.packageExtension();
        break;
      case "standalone":
        this.copyToStandalone();
        break;
      case "translate":
        new Translator(this.srcDir).generateTranslations();
        break;
      case "resize":
        // Args read: --icon, --screenshot, --tile, --marquee
        new ImageResizer().resizeImages(args);
        break;
      case "download":
        new ChromeExtensionDownloader().download(args.url, args.dest);
        break;
      case "compat":
        new BrowserCompatibilityAnalyzer(
          args.src ?? this.outDir,
          this.browser
        ).analyze();
        break;
      case "validate":
        new ManifestValidator(
          this.srcDir ?? this.outDir,
          this.browser
        ).runAllValidations();
      case "publish":
        new StorePublisher().publishItemPublic("random_id");
        break;
      default:
        console.error("Unknown task", args.task);
    }
  }

  // Clean output directory
  clean(dir) {
    return new Promise((resolve, reject) => {
      fs.rm(dir, { recursive: true }, (err) => {
        if (err) {
          if (err.code == "ENOENT") {
            // Directory already deleted or doesn't exist.
            resolve();
          } else {
            reject(err);
          }
          return;
        }
        resolve();
      });
    });
  }

  // Bundle scripts.
  async bundleScripts() {
    await esbuild.build({
      entryPoints: manifest.__entryPoints,
      bundle: true,
      minify: this.isProd,
      sourcemap: !this.isProd,
      loader: {
        ".txt.html": "text",
        ".txt.css": "text",
        ".file.css": "file",
        ".woff2": "dataurl",
      },
      banner: {
        js: `var IS_DEV_BUILD=${!this.isProd};`,
      },
      outdir: this.outDir,
      target: ["chrome107"], // https://en.wikipedia.org/wiki/Google_Chrome_version_history
    });
  }

  async watch() {
    const buildAndCatchError = async (event, filename) => {
      try {
        await this.buildExtension();

        const timeString = new Date().toLocaleTimeString("en-US", {
          hour12: false, // Use 24-hour format
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
        console.log(
          timeString,
          `Successfully rebuilt extension due to: ${event} on ${filename}`
        );
      } catch (e) {
        console.error("Error building extension: ", e);
      }
    };

    await buildAndCatchError("initial invocation", "all files");
    console.log("Built extension and listening for changes...");
    // The watch+serve APIs on esbuild are still evolving and a bit too rapid for the use-case here.
    // In v0.16 (current) - esbuild.build has a watch option
    // In v0.17 (next) - watch and serve are moved to a new context API.
    // It is not yet clear how to monitor changes to HTML and other non-entrypoint files.
    // The NodeJs API is unstable as well, specifically it's known to fire duplicate events, which explains the timeouts below.
    let fsTimeout = null;
    fs.watch("src", { recursive: true }, (event, filename) => {
      if (fsTimeout) {
        return;
      }
      fsTimeout = setTimeout(async () => {
        fsTimeout = null;
        await buildAndCatchError(event, filename);
      }, 100);
    });
  }

  // Generate manifest
  // NB: This function would fail if outDir doesn't exist yet.
  // For browser manifest.json compatibility see https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Browser_compatibility_for_manifest.json
  generateManifest() {
    const removeBrowserPrefixesForManifest = (obj) => {
      const cleanedObj = {};
      for (let [key, value] of Object.entries(obj)) {
        // Recursively apply this check on values.
        if (typeof value === "object" && !Array.isArray(value)) {
          value = removeBrowserPrefixesForManifest(value);
        }

        if (!key.startsWith("__")) {
          cleanedObj[key] = value;
        } else if (key.startsWith(`__${this.browser}__`)) {
          cleanedObj[key.replace(`__${this.browser}__`, "")] = value;
        }
      }
      return cleanedObj;
    };

    return new Promise((resolve, reject) => {
      let rawdata = fs.readFileSync("src/manifest.json");
      let manifest = JSON.parse(rawdata);

      if (!this.isProd) {
        manifest.name = "[DEV] " + manifest.name;
      }

      const browserManifest = removeBrowserPrefixesForManifest(manifest);

      const formattedJson = JSON.stringify(browserManifest, null, 4);

      fs.mkdir(this.outDir, { recursive: true }, (err) => {
        if (err) {
          reject(err); // Reject if directory creation fails
          return;
        }

        fs.writeFile(
          path.join(this.outDir, "manifest.json"),
          formattedJson,
          (err) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          }
        );
      });
    });
  }

  // Generate standalone library.
  async copyToStandalone() {
    await this.buildExtension();

    let fileMap = {};
    fileMap[this.outDir + "/assets"] = "standalone/assets";
    fileMap[this.outDir + "/_locales"] = "standalone/_locales";
    fileMap[this.outDir + "/content-script"] = "standalone/content-script";

    return this.copy(fileMap);
  }

  // Copy assets.
  copyAssets() {
    // Map of static files/directories to destinations we want to copy them to.
    const fileMap = manifest.__assets;
    return this.copy(fileMap);
  }

  copy(fileMap) {
    return new Promise((resolve, reject) => {
      let copied = 0;
      if (!fileMap || Object.keys(fileMap).length == 0) {
        console.warn(
          "No assets to copy. Ensure the __assets key is set in manifest.json"
        );
        resolve();
      }
      for (const [src, dest] of Object.entries(fileMap)) {
        fs.cp(
          src,
          this.outDir + dest,
          { force: true, recursive: true },
          (err) => {
            if (err) {
              reject(err);
              return;
            } else {
              copied++;

              // Resolve when all files are succcessfully copied.
              if (copied === Object.keys(fileMap).length) {
                resolve();
              }
            }
          }
        );
      }
    });
  }

  // Package extension.
  async packageExtension() {
    try {
      await this.buildExtension();
    } catch (e) {
      console.error("Build failed: ", e.message);
      return;
    }

    try {
      await new ManifestValidator(
        this.outDir,
        this.browser
      ).runAllValidations();
    } catch (e) {
      console.error(
        "Aborting packaging due to validation errors: \n",
        e.message
      );
      return;
    }
    return new Promise((resolve, reject) => {
      // Step into the directory to zip to avoid including directory in zip (for firefox).
      exec(`cd ${this.outDir} && zip -r archive .`, (error, stdout, stderr) => {
        if (error) {
          reject(error);
          return;
        }
        if (stderr) {
          reject(stderr);
          return;
        }
        console.log(`Zipped files successfully`);
        resolve();
      });
    });
  }

  // Tests
  buildAndExecuteTests() {
    const buildTest = esbuild
      .build({
        entryPoints: this.tsSpecs,
        bundle: true,
        outdir: "spec/out",
        platform: "node",
        banner: {
          js: `var IS_DEV_BUILD=true;var chrome=null`,
        },
      })
      .catch((err) => {
        console.error(err);
        process.exit(1);
      });

    return new Promise((resolve) => {
      buildTest.then(() => {
        const jasmine = new Jasmine();
        jasmine.loadConfig({
          spec_files: this.testSpecs,
          random: false,
        });
        jasmine.exitOnCompletion = false;

        jasmine.execute().then((doneInfo) => {
          // multiple execute calls on jasmine env errors. See https://github.com/jasmine/jasmine/issues/1231#issuecomment-26404527
          // compiledTestSpecs.forEach((f) => decache(f));
          resolve(doneInfo);
        });
      });
    });
  }

  async buildExtension() {
    console.log("Cleaning output directory...");
    await this.clean(this.outDir);
    console.log("Copying assets...");
    await this.copyAssets();
    console.log("Bundling scripts...");
    await this.bundleScripts();
    console.log("Generating manifest...");
    await this.generateManifest();
  }

  async launchBrowser() {
    await this.packageExtension();
    const launchOptions = {
      headless: false,
      ignoreDefaultArgs: ["--disable-extensions", "--enable-automation"],
      // load multiple extensions - https://stackoverflow.com/a/66752286
      args: [
        `--disable-extensions-except=${process.env.PWD}/${this.outDir}`,
        `--load-extension=${process.env.PWD}/${this.outDir}`,
      ],
    };
    if (this.browser === "firefox") {
      /* If this command fails with firefox not found, run:
       * `PUPPETEER_PRODUCT=firefox npm i -D puppeteer --prefix ./node_modules/firefox-puppeteer`
       */
      launchOptions.product = "firefox";
    }
    console.log("Launching test browser with extension");
    await puppeteer.launch(launchOptions);
  }

  test() {
    this.buildExtension().then(() => {
      // Set output dir for test environment.
      process.env["XTENSION_OUTPUT_DIR"] = this.outDir;

      // Build and run tests.
      this.buildAndExecuteTests();
    });
  }
}

new Build();
