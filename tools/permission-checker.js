import fs from "fs";
import path from "path";

// Permissions mapping for Chrome Extension APIs.  Reference https://developer.chrome.com/docs/extensions/reference/permissions-list
export const PERMISSIONS_MAP = {
  "chrome.accessibilityFeatures.modify": "accessibilityFeatures.modify",
  "chrome.accessibilityFeatures.read": "accessibilityFeatures.read",
  "chrome.alarms": "alarms",
  "chrome.audio": "audio",
  "chrome.background": "background",
  "chrome.bookmarks": "bookmarks",
  "chrome.browsingData": "browsingData",
  "chrome.certificateProvider": "certificateProvider",
  "chrome.clipboard.read": "clipboardRead",
  "chrome.clipboard.write": "clipboardWrite",
  "chrome.commands": "commands",
  "chrome.contentSettings": "contentSettings",
  "chrome.contextMenus": "contextMenus",
  "chrome.cookies": "cookies",
  "chrome.declarativeContent": "declarativeContent",
  "chrome.declarativeNetRequest": "declarativeNetRequest",
  "chrome.declarativeNetRequestWithHostAccess":
    "declarativeNetRequestWithHostAccess",
  "chrome.declarativeNetRequestFeedback": "declarativeNetRequestFeedback",
  "chrome.debugger": "debugger",
  "chrome.devtools.inspectedWindow": "devtools",
  "chrome.devtools.network": "devtools",
  "chrome.devtools.panels": "devtools",
  "chrome.dns": "dns",
  "chrome.desktopCapture": "desktopCapture",
  "chrome.documentScan": "documentScan",
  "chrome.downloads": "downloads",
  "chrome.downloads.open": "downloads.open",
  "chrome.downloads.ui": "downloads.ui",
  "chrome.enterprise.deviceAttributes": "enterprise.deviceAttributes",
  "chrome.enterprise.hardwarePlatform": "enterprise.hardwarePlatform",
  "chrome.enterprise.networkingAttributes": "enterprise.networkingAttributes",
  "chrome.enterprise.platformKeys": "enterprise.platformKeys",
  "chrome.favicon": "favicon",
  "chrome.fileBrowserHandler": "fileBrowserHandler",
  "chrome.fileSystemProvider": "fileSystemProvider",
  "chrome.fontSettings": "fontSettings",
  "chrome.gcm": "gcm",
  "chrome.geolocation": "geolocation",
  "chrome.history": "history",
  "chrome.identity": "identity",
  "chrome.identity.email": "identity.email",
  "chrome.idle": "idle",
  "chrome.loginState": "loginState",
  "chrome.management": "management",
  "chrome.nativeMessaging": "nativeMessaging",
  "chrome.notifications": "notifications",
  "chrome.offscreen": "offscreen",
  "chrome.pageCapture": "pageCapture",
  "chrome.platformKeys": "platformKeys",
  "chrome.power": "power",
  "chrome.printerProvider": "printerProvider",
  "chrome.printing": "printing",
  "chrome.printingMetrics": "printingMetrics",
  "chrome.privacy": "privacy",
  "chrome.processes": "processes",
  "chrome.proxy": "proxy",
  "chrome.readingList": "readingList",
  "chrome.runtime.connectNative": "runtime",
  "chrome.runtime.sendNativeMessage": "runtime",
  "chrome.scripting": "scripting",
  "chrome.search": "search",
  "chrome.sessions": "sessions",
  "chrome.sidePanel": "sidePanel",
  "chrome.storage": "storage",
  "chrome.storage.local": "unlimitedStorage",
  "chrome.system.cpu": "system.cpu",
  "chrome.system.display": "system.display",
  "chrome.system.memory": "system.memory",
  "chrome.system.storage": "system.storage",
  "chrome.tabCapture": "tabCapture",
  "chrome.tabGroups": "tabGroups",
  "chrome.tabs": "tabs",
  "chrome.tabs.captureVisibleTab": "activeTab",
  "chrome.topSites": "topSites",
  "chrome.tts": "tts",
  "chrome.ttsEngine": "ttsEngine",
  "chrome.unlimitedStorage": "unlimitedStorage",
  "chrome.vpnProvider": "vpnProvider",
  "chrome.wallpaper": "wallpaper",
  "chrome.webAuthenticationProxy": "webAuthenticationProxy",
  "chrome.webNavigation": "webNavigation",
  "chrome.webRequest": "webRequest",
  "chrome.webRequestBlocking": "webRequestBlocking",
};

/**
 * Extract permissions required based on the APIs used in the code.
 * @param {string} sourceCode - The source code of the service worker.
 * @returns {string[]} - Array of required permissions.
 */
function extractPermissions(sourceCode) {
  const permissions = new Set();

  for (const [apiPattern, permission] of Object.entries(PERMISSIONS_MAP)) {
    // TODO: Make this matcher for robust (to exclude comments and string literals)
    const regex = new RegExp(apiPattern.replace(".", "\\."), "g");
    if (regex.test(sourceCode)) {
      permissions.add(permission);
    }
  }

  return Array.from(permissions);
}

/**
 * Validate the permissions and optional_permissions against the required permissions.
 * @param {string} filePath - Path to the JavaScript file to analyze.
 * @param {string[]} permissions - Array of declared permissions.
 * @param {string[]} optionalPermissions - Array of declared optional_permissions.
 * @returns {object} - Validation result object.
 */
export function validatePermissions(
  basePath,
  filePaths,
  permissions,
  optionalPermissions
) {
  try {
    let requiredPermissions = [];
    for (const filePath of filePaths) {
      const absolutePath = path.resolve(path.join(basePath, filePath));
      const sourceCode = fs.readFileSync(absolutePath, "utf-8");
      requiredPermissions.push(...extractPermissions(sourceCode));
    }
    requiredPermissions = Array.from(new Set(requiredPermissions));

    const declaredPermissions = new Set([
      ...permissions,
      ...optionalPermissions,
    ]);

    const missingPermissions = requiredPermissions.filter(
      (permission) => !declaredPermissions.has(permission)
    );
    if (missingPermissions.length > 0) {
      throw new Error(
        `Missing required permissions: ${missingPermissions.join(", ")}`
      );
    }

    const unusedPermissions = Array.from(declaredPermissions).filter(
      (permission) => !requiredPermissions.includes(permission)
    );
    if (unusedPermissions.length > 0) {
      throw new Error(
        `Unused declared permissions: ${unusedPermissions.join(", ")}`
      );
    }

    return { message: "Permission validation", status: "PASS" };
  } catch (error) {
    return {
      message: "Permission validation",
      status: "FAIL",
      error: error,
    };
  }
}
