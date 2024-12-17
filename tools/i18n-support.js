/* 
* This script outputs the stats of i18n support for chrome extensions.
* Sample output:
Total items: 175179
Items with exactly 1 supported language: 153570
Items with more than 1 supported language: 21609
*/
import fs from "fs/promises";
import { parse } from "csv-parse/sync";

async function processFile(filePath) {
  try {
    // Read the CSV file
    const data = await fs.readFile(filePath, "utf-8");
    const records = parse(data, { columns: true });

    // Initialize counters
    let totalItems = 0;
    let singleLanguageItems = 0;
    let multipleLanguageItems = 0;

    // Process each record
    for (const record of records) {
      totalItems++;

      // Convert the encoded "supportedLanguages" string to an array
      const supportedLanguages = record.supportedLanguages.split(",");

      // Update counters based on the number of supported languages
      if (supportedLanguages.length === 1) {
        singleLanguageItems++;
      } else if (supportedLanguages.length > 1) {
        multipleLanguageItems++;
      }
    }

    // Return the statistics
    return {
      totalItems,
      singleLanguageItems,
      multipleLanguageItems,
    };
  } catch (error) {
    console.error("Error processing file:", error);
    throw error;
  }
}

// stats.csv is ranking-stats csv from chrome-stats.com
const filePath = "./stats.csv";
processFile(filePath)
  .then((stats) => {
    console.log("Total items:", stats.totalItems);
    console.log(
      "Items with exactly 1 supported language:",
      stats.singleLanguageItems,
    );
    console.log(
      "Items with more than 1 supported language:",
      stats.multipleLanguageItems,
    );
  })
  .catch((error) => {
    console.error("Error:", error);
  });
