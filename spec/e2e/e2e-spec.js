import * as puppeteer from "puppeteer";
import looksSame from "looks-same";
import fs from "fs";
import path from "path";

// Puppeteer chrome extension testing guide - https://pptr.dev/guides/chrome-extensions

// Utility function for sleeping
const sleep = (mseconds) =>
  new Promise((resolve) => setTimeout(resolve, mseconds));

const outDir = "build/chrome-dev"; // process.env.XTENSION_OUTPUT_DIR;

// To test other browsers like brave, opera, provide their executable path - https://stackoverflow.com/a/59484822.
describe("Browser test suite", () => {
  let browser;
  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: false,
      dumpio: true,
      ignoreDefaultArgs: ["--disable-extensions", "--enable-automation"],
      args: [
        `--disable-extensions-except=${process.env.PWD}/${outDir}`,
        `--load-extension=${process.env.PWD}/${outDir}`,
      ],
    });
  });

  afterAll(async () => {
    // await browser.close();
  });

  describe("Welcome page", () => {
    it("should be opened automatically", async () => {
      const welcomePageTarget = await browser.waitForTarget(
        (target) => target.url().endsWith("welcome.html"),
        { timeout: 5000 }
      );
      expect(welcomePageTarget).toBeDefined();
    });

    it("should not look different from golden UI", async () => {
      const welcomePageTarget = await browser.waitForTarget(
        (target) => target.url().endsWith("welcome.html"),
        { timeout: 5000 }
      );
      const welcomePage = await welcomePageTarget.page();

      const looksSame = await doesPageLookLikeGolden(
        welcomePage,
        "spec/e2e/goldens/welcome-page.png"
      );
      expect(looksSame).toBeTrue();
    });
  });

  describe("Standalone page", () => {
    let extensionId = "";

    it("should have a title", async () => {
      if (!extensionId) {
        extensionId = await getExtensionId(browser);
      }
      expect(extensionId).toBeDefined();
    });
  });
});

const getExtensionId = async (browser) => {
  const workerTarget = await browser.waitForTarget(
    // Assumes that there is only one service worker created by the extension and its URL ends with background.js.
    (target) =>
      target.type() === "service_worker" &&
      target.url().endsWith("service-worker.js")
  );
  return new URL(workerTarget.url()).host;
};

async function createDirectoriesForFile(filePath) {
  const dir = path.dirname(filePath);
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch (err) {
    console.error("Error creating directories:", err);
  }
}

const doesPageLookLikeGolden = async (page, goldenPath) => {
  expect(page).toBeDefined();
  await createDirectoriesForFile(goldenPath);
  const outPath = goldenPath.replace(".png", "-temp.png");

  await page.setViewport({
    // 1920x1080 is the most popular screen resolution as of Dec. 2024.
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    isMobile: false,
  });

  // Wait for i18n script and others.
  await sleep(2000);
  await page.screenshot({
    path: outPath,
    captureBeyondViewport: true,
    fullPage: true,
  });

  const {
    equal,
    diffImage,
    differentPixels,
    totalPixels,
    diffBounds,
    diffClusters,
  } = await looksSame(goldenPath, outPath, {
    createDiffImage: true,
    tolerance: 5,
    ignoreAntialiasing: true,
    antialiasingTolerance: 3,
    ignoreCaret: true,
  });

  const diffPath = outPath.replace(".png", "-diff.png");
  if (!equal) {
    await diffImage.save(diffPath);
    console.log(
      "Review the new screenshot, and if applicable, update the golden"
    );
  } else {
    try {
      fs.unlinkSync(outPath);
      fs.unlinkSync(diffPath);
    } catch (err) {}
  }
  return equal;
};
