
import { SettingsUI } from '../utils/settings/settings';
import '../utils/feedback/feedback';
import { RemoteLogger } from '../utils/logger';
import { FeedbackData } from '../background-script/feedback-checker';
import { FEEDBACK_DATA_KEY } from '../utils/storage';
import Storage from '../utils/storage';

const optionsEl = new SettingsUI([ {
  id: "disable-extension-on-site",
  type: "checkbox",
  title: "Disable extension on this site",
  description: "You will no longer see preview search results or view smart actions on this website",
  default_value: false,
},]);
document.body.appendChild(optionsEl);

document.querySelector("#go-to-options")?.addEventListener("click", () => {
  if (chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  } else {
    window.open(chrome.runtime.getURL("options.html"));
  }
});

const L = new RemoteLogger("popup");
L.debug("Init success");

async function shouldShowFeedbackForm() {
  const feedbackData: FeedbackData = await Storage.get(FEEDBACK_DATA_KEY);
  return feedbackData.status == "eligible";
}

shouldShowFeedbackForm().then(val => {
  L.debug("Should show feedback form:", val);
  if(val) {
    const ff = document.querySelector("feedback-form") as HTMLElement;
    if(ff) {
      ff.style.display = "block"
    }
  }
});