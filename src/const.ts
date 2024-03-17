// No deps. Treat as json file.

export const packageName = "xtension";
export const extensionId = chrome?.i18n?.getMessage("@@extension_id");
export const applicationId = packageName + "/" + extensionId;
export const sentryDsn =
  "https://b1d81a9e5f1546f79885a473ce33128c@o526305.ingest.sentry.io/6244539";
export const measurementId = "G-JWLV6CJVSJ";
export const gaApiSecret = "E2EWHH--QbSaf9-f0ePC5g";
export const uninstallUrl = "https://forms.gle/AUoB1eLxRjN8j3xM9";
export const storeLink =
  "https://chrome.google.com/webstore/detail/" + extensionId;
