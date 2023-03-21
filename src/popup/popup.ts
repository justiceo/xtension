
import { SettingsUI } from '../utils/options/settings';
import '../utils/feedback/feedback';
import { RemoteLogger } from '../utils/logger';

const optionsEl = new SettingsUI([ {
  id: "disable-extension-on-site",
  type: "checkbox",
  title: "Disable extension on this site",
  description: "You will no longer see preview search results or view smart actions on this website",
},]);
document.body.appendChild(optionsEl);

document.querySelector("#go-to-options").addEventListener("click", () => {
  if (chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  } else {
    window.open(chrome.runtime.getURL("options.html"));
  }
});

const L = new RemoteLogger("popup");
L.debug("Init success");
