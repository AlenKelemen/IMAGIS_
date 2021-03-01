import "@fortawesome/fontawesome-pro/css/fontawesome.css";
import "@fortawesome/fontawesome-pro/css/regular.min.css";
import Container from "./container";
import Control from "ol/control/Control";
import Toggle from "./toggle";
import { elt } from "./util";
import moment from "moment";

export default class Project extends Toggle {
  constructor(options = {}) {
    if (!options.className) options.className = "toggle";
    if (!options.html) options.html = '<i class="far fa-cog fa-fw"></i>';
    super(options);
    this.container = new Container({
      semantic: "section",
      className: `taskpane`,
    });
    options.target.addControl(this.container);
    this.map = this.container.getMap();
    this.container.setVisible(this.active);
    this.on("change:active", (evt) => this.container.setVisible(evt.active));
    this.header = elt("div", { className: "header center" }, "Postavke");
    this.main = elt("main", { className: `main` }, this.header);
    this.container.element.appendChild(this.main);
    this.content();
    this.footer = elt("div", { className: "footer center" }, "Pogledaj postavke");
    this.main.appendChild(this.footer);
  }
  content() {
    const n = 150;
    for (let i = 0; i < n; i++) {
      this.main.appendChild(elt("div", { className: `item` },`item: ${i}`));
    }
  }
}
