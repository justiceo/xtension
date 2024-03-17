import { Logger } from "../utils/logger";
import Storage from "../utils/storage";
import "./content-script.css";

export class ContentScript {
  logger = new Logger(this);

  init() {
    this.listenForBgMessage();
  }

  showDemo() {
    this.logger.debug("#showDemo");
  }

  listenForBgMessage() {
    chrome?.runtime?.onMessage?.addListener((request, sender, callback) => {
      this.logger.debug("#onMessage: ", request);
      callback("ok");
    });
  }
}

Storage.isCurrentSiteBlocked().then((isBlocked) => {
  // Remove if it's okay to run on all frames.
  const isTopFrame = window.self === window.top;

  if (!isBlocked && isTopFrame) {
    new ContentScript().init();
  }
});
