import { Logger } from "../utils/logger";
import { ContentScript } from "../content-script/content-script";
import { translateMarkup } from "../utils/i18n";
import { storeLink, githubLink } from "../const";
import "./welcome.css";

export class Welcome {
  logger = new Logger(this);
  contentScript = new ContentScript();

  init() {
    this.contentScript.init();
    translateMarkup(document);

    document.querySelector("#demo-button")?.addEventListener("click", (e) => {
      this.contentScript.showDemo();
    });

    document
      .querySelectorAll(".homepage-link")
      ?.forEach((e) => e.setAttribute("href", storeLink));
    document
      .querySelectorAll(".github-link")
      ?.forEach((e) => e.setAttribute("href", githubLink));
  }
}

window.addEventListener("load", (e) => {
  new Welcome().init();
});
