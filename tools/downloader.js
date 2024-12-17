import axios from "axios";
import { promises as fs } from "fs";
import StreamZip from "node-stream-zip";
import path from "path";

export class ChromeExtensionDownloader {
  constructor() {
    // Matches URLs of the form
    // https://chromewebstore.google.com/detail/search-link-preview/mmmfofondapflhgbdidadejnechhjocm
    // and https://chromewebstore.google.com/detail/mmmfofondapflhgbdidadejnechhjocm
    this.chromeURLPattern =
      /^https?:\/\/chromewebstore.google.com\/detail(?:\/[^\/]+)?\/([a-z]{32})(?=[\/#?]|$)/;
  }

  async download(url, destination = "") {
    try {
      const extensionId = this.extractExtensionId(url);
      const crxData = await this.downloadCRX(extensionId);
      const zipData = this.extractZipFromCRX(crxData);
      const tempZipPath = await this.saveZipToFile(zipData, extensionId);
      const finalPath = await this.extractAndRename(
        zipData,
        tempZipPath,
        destination,
        extensionId,
      );
      console.log(`Extension downloaded and unpacked to '${finalPath}'`);
    } catch (error) {
      console.error("Error:", error.message);
    }
  }

  extractExtensionId(url) {
    const match = this.chromeURLPattern.exec(url);
    if (!match) {
      throw new Error("Invalid URL or unsupported URL format.");
    }
    return match[1];
  }

  async downloadCRX(extensionId) {
    const crxUrl = `https://clients2.google.com/service/update2/crx?response=redirect&prodversion=91.0.1609.0&acceptformat=crx2,crx3&x=id%3D${extensionId}%26uc`;
    const response = await axios.get(crxUrl, { responseType: "arraybuffer" });
    return new Uint8Array(response.data);
  }

  extractZipFromCRX(crxData) {
    const zipStartOffset =
      12 +
      (crxData[8] +
        (crxData[9] << 8) +
        (crxData[10] << 16) +
        ((crxData[11] << 24) >>> 0));
    return crxData.slice(zipStartOffset);
  }

  async saveZipToFile(zipData, extensionId) {
    const tempZipPath = path.join(`temp-${extensionId}.zip`);
    await fs.writeFile(tempZipPath, zipData);
    return tempZipPath;
  }

  async extractAndRename(zipData, tempZipPath, destination, extensionId) {
    const zip = new StreamZip.async({ file: tempZipPath });
    const extractPath = destination || extensionId;
    await zip.extract(null, extractPath);
    await zip.close();

    const manifestPath = path.join(extractPath, "manifest.json");
    const manifest = JSON.parse(await fs.readFile(manifestPath, "utf-8"));
    const finalPath = destination || manifest.name;

    if (!destination) {
      await fs.rename(extractPath, finalPath);
    }

    await fs.unlink(tempZipPath);
    return finalPath;
  }
}
