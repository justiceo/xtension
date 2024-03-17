import { MenuItem, Config } from "./types";
import { i18n } from "./utils/i18n";

export const contextMenus: MenuItem[] = [];

export const configOptions: Config[] = [
  {
    id: "disable-extension-on-site",
    type: "checkbox",
    title: i18n("Temporarily disable extension"),
    description: i18n("Turns off the extension on all websites."),
    default_value: false,
  },
  {
    id: "disable-sync",
    type: "checkbox",
    title: i18n("Disable storage sync"),
    description: i18n("Your settings will not propagate to other browsers."),
    default_value: false,
    dev_only: false,
  },
  {
    id: "blocked-sites",
    type: "textarea",
    title: i18n("Disabled on Websites"),
    description: i18n(
      "Extension will not run on these sites. Enter one site per line."
    ),
    default_value: "",
  },
];
