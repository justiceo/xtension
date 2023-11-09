import "@webcomponents/custom-elements";
import bootstrap from "./bootstrap.bundle.min.js";
import bootstrapCSS from "./bootstrap5.txt.css";
import formHtml from "./settings.txt.html";
import Storage from "../storage.js";
import { Logger } from "../logger.js";
import { i18n } from "../i18n.js";

export interface Config {
  id: string;
  title: string;
  description: string;
  type: "checkbox" | "switch" | "text" | "range" | "select" | "textarea" | "radio";
  default_value: string | boolean | number;  

  value?: any;
  options?: string[];
  min?: number;
  max?: number;
}

export class SettingsUI extends HTMLElement {
  configItems: Config[];
  template!: HTMLElement;
  logger = new Logger(this);

  constructor(configItems: Config[]) {
    // Always call super first in constructor
    super();

    this.configItems = configItems;
    // Create a shadow root
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.logger.debug("SettingsUI added to page.");

    this.fetchAndSetConfigValues(this.configItems).then((options) => {
      this.render(options);
    });
  }
  disconnectedCallback() {
    this.logger.debug("SettingsUI element removed from page.");
  }

  adoptedCallback() {
    this.logger.debug("SettingsUI element moved to new page.");
  }

  // Fetch value of each option from storage, set to default_value otherwise.
  async fetchAndSetConfigValues(options: Config[]) {
    for (const option of options) {
      const val = await Storage.get(option.id);
      if (val == null || val === undefined) {
        option.value = option.default_value;
      } else {
        option.value = val;
      }
    }
    return options;
  }

  render(options: Config[]): void {
    const style = document.createElement("style");
    style.textContent = `
    ${bootstrapCSS}
    
    input[type="checkbox"] {
      /* Double-sized Checkboxes */
      -ms-transform: scale(1.4); /* IE */
      -moz-transform: scale(1.4); /* FF */
      -webkit-transform: scale(1.4); /* Safari and Chrome */
      -o-transform: scale(1.4); /* Opera */
      padding: 10px;
    }
    
    .collapse {
      margin-top: 15px;
    }
    .container {
      min-width: 400px;
      min-height: 400px;
    }

    .toast {
      width: auto;
    }
  `;

    this.template = document.createElement("div");
    this.template.innerHTML = formHtml;

    const output = document.createElement("ul");
    output.className = "list-group";
    options.forEach((o) => output.appendChild(this.cloneInput(o)));
    this.shadowRoot?.append(style, output);
  }

  async saveChange(option, updatedValue) {
    this.logger.debug("saving: ", option.id, updatedValue);
    await Storage.put(option.id, updatedValue);
    this.showToast();
  }

  // Clone the template and set the title, description, and value.
  cloneInput(option: Config): HTMLElement {
    let input = this.template
      .getElementsByClassName(`${option.type}-template`)[0]
      .cloneNode(true) as HTMLElement;

    input.getElementsByClassName(`control-title`)[0].innerHTML = i18n(option.title);
    input.getElementsByClassName(`control-description`)[0].innerHTML =
      i18n(option.description);

    const eventHandler = (e: Event) => {
      const data =
        ["checkbox", "switch"].indexOf(option.type) >= 0
          ? e.target?.checked
          : e.target?.value;
      this.saveChange(option, data);
    };

    const actualInput = input.getElementsByClassName(
      "control-input"
    )[0] as HTMLInputElement;
    ["checkbox", "switch"].indexOf(option.type) >= 0
      ? (actualInput.checked = !!option.value)
      : (actualInput.value = option.value);

    option.type === "select"
      ? actualInput.addEventListener("change", eventHandler)
      : actualInput.addEventListener("input", eventHandler);

    if (option.type === "range") {
      actualInput.min = option.min;
      actualInput.max = option.max;
    }
    if (option.type === "select") {
      // option.options.forEach(e => {
      //   (actualInput as unknown as HTMLSelectElement).add(new Option(e, e));
      // });
    }

    return input;
  }

  showToast() {
    // Check if element is already inserted and use it, other-wise, add it.
    let toastEl = this.shadowRoot?.querySelector(".toast-container");
    if (!toastEl) {
      toastEl = this.template.querySelector(".toast-container")!;
      this.shadowRoot?.append(toastEl);
    }
    const toast = new bootstrap.Toast(toastEl.querySelector("#liveToast"), {
      delay: 1000,
    });
    this.logger.log("showing toast: ", bootstrap, toast);
    toast.show();
  }
}

customElements.define("settings-ui", SettingsUI);
