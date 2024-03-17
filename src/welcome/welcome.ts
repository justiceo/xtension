import { ContentScript } from "../content-script/content-script";

const contentScript = new ContentScript();
contentScript.init();

window.addEventListener("load", (e) => {
  document.querySelector("#demo-button")?.addEventListener("click", (e) => {
    contentScript.showDemo();
  });
});
