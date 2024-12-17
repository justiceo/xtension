import fs from "fs/promises";
import path from "path";

async function concatenateFiles(filePaths, outputFilePath) {
  try {
    let outputContent = "";

    for (const filePath of filePaths) {
      try {
        const fileStats = await fs.stat(filePath);

        if (fileStats.isFile()) {
          const fileExtension = path.extname(filePath).toLowerCase();
          const nonBinaryExtensions = [
            ".txt",
            ".js",
            ".ts",
            ".html",
            ".css",
            ".json",
            ".md",
          ];

          if (nonBinaryExtensions.includes(fileExtension)) {
            const fileContent = await fs.readFile(filePath, "utf8");
            outputContent += `//// begin-file:${filePath}\n${fileContent}\n//// end-file:${filePath}\n\n`;
          } else {
            outputContent += `//// binary-file:${filePath}\n\n`;
          }
        } else {
          console.log(`Invalid path: ${filePath}`);
        }
      } catch (error) {
        console.log(`Error processing file: ${filePath}`);
        console.error(error);
      }
    }

    await fs.writeFile(outputFilePath, outputContent);
  } catch (error) {
    console.error("Error concatenating files:", error);
  }
}

// Usage example
const localFilePaths = ["esbuild.js", "i18n-support.js", "downloader.js"];
const filePaths = [
    "spec/e2e-spec.ts",
    "spec/i18n-spec.ts",
    "src/_locales/en/messages.json",
    "src/_locales/es/messages.json",
    "src/assets/logo-128x128.png",
    "src/assets/logo-48x48.png",
    "src/assets/logo-16x16.png",
    "src/background-script/service-worker.ts",
    "src/content-script/content-script.ts",
    "src/options-page/options.html",
    "src/options-page/options.ts",
    "src/options-page/options.css",
    "src/popup/popup.html",
    "src/popup/popup.ts",
    "src/popup/popup.css",
    "src/side-panel/side-panel.html",
    "src/side-panel/side-panel.ts",
    "src/side-panel/side-panel.css",
    "src/utils/analytics.ts",
    "src/utils/context-menus.ts",
    "src/utils/feedback-checker.ts",
    "src/utils/i18n.ts",
    "src/utils/logger.ts",
    "src/utils/post-install.ts",
    "src/utils/session-id.ts",
    "src/utils/storage.ts",
    "src/welcome/welcome.html",
    "src/welcome/welcome.ts",
    "src/welcome/welcome.css",
    "src/manifest.json",
    "package.json",
    "README.md",
]

const outputFilePath = "output.txt";

concatenateFiles(filePaths, outputFilePath)
  .then(() => {
    console.log(`Concatenated files into: ${outputFilePath}`);
  })
  .catch((error) => {
    console.error("Error concatenating files:", error);
  });
