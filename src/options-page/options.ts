import "./options.css";
import { Config, SettingsUI } from "../utils/options/settings";
import { WinBox } from "../utils/winbox/winbox";

class OptionsPage {
  render(options) {
    const optionsEl = new SettingsUI(options);
    document.body.appendChild(optionsEl);

    // Show winbox demo.
    document.querySelector("#winbox-demo")?.addEventListener("click", () => {
      new WinBox("Winbox Title", {
        width: "400px",
        height: "400px",
        shadowel: "test-shadow",
        html: `<h1>Hello winbox</h1>`
      });
    });
  }
}

const config: Config[] = [
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
  },
  {
    id: "radio-id",
    type: "radio",
    title: "Sample radio title",
    description: "The detail information about the radio here.",
    default_value: 1,
  },
  {
    id: "switch-id",
    type: "switch",
    title: "Sample switch title",
    description: "The detail information about the switch here.",
    default_value: true,
  },
  {
    id: "select-id",
    type: "select",
    title: "Sample select title",
    description: "The detail information about the select here.",
    default_value: 2,
  },
  {
    id: "range-id",
    type: "range",
    title: "Sample range title",
    description: "The detail information about the range here.",
    default_value: 0,
  },
  {
    id: "textarea-id",
    type: "textarea",
    title: "Sample textarea title",
    description: "The detail information about the textarea here.",
    default_value: "hello world",
  },
];
let op = new OptionsPage();
op.render(config);
