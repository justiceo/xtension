import { Config, MenuItem } from "./types";

export const packageName = "xtension";
export const applicationId =
  packageName + "/" + chrome?.i18n?.getMessage("@@extension_id");
export const sentryDsn =
  "https://b1d81a9e5f1546f79885a473ce33128c@o526305.ingest.sentry.io/6244539";
export const measurementId = "G-JWLV6CJVSJ";
export const gaApiSecret = "E2EWHH--QbSaf9-f0ePC5g";
export const uninstallUrl = "https://forms.gle/AUoB1eLxRjN8j3xM9";
export const configOptions: Config[] = [
  {
    id: "disable-extension-on-site",
    type: "checkbox",
    title: "Temporarily disable extension",
    description: "Turns off the extension on all websites.",
    default_value: false,
  },
  {
    id: "disable-sync",
    type: "checkbox",
    title: "Disable storage sync",
    description: "Your settings will not propagate to other browsers.",
    default_value: false,
    dev_only: false,
  },
  {
    id: "blocked-sites",
    type: "textarea",
    title: "Disabled on Websites",
    description:
      "Extension will not run on these sites. Enter one site per line.",
    default_value: "",
  },
];

export const contextMenus: MenuItem[] = [];
