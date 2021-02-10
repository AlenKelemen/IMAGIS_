import "@fortawesome/fontawesome-pro/css/fontawesome.css";
import "@fortawesome/fontawesome-pro/css/regular.min.css";
import Container from "./container";
import Toggle from "./toggle";
import { elt } from "./util";
import { toContext } from "ol/render";
import { Icon, Style } from "ol/style";
import { LineString, Point, Polygon } from "ol/geom";
import VectorLayer from "ol/layer/Vector";
import TileLayer from "ol/layer/Tile";
const images = require("../img/*.png");
/** Legend
 * @constructor
 * @extends {ol_control_Control}
 * @param {Object=} options Control options.
 * @param {string[]} options.className clase to add to control
 * @param {string} options.tipLabel html title of the control
 * @param {string} options.html html to insert in the control
 * @param {boolean=false} options.active control active, default false
 * @param {Object} options.target contaner target element
 */
export default class Legend extends Toggle {
  constructor(options = {}) {
    if (!options.className) options.className = "toggle";
    if (!options.html) options.html = '<i class="far fa-layer-group fa-fw"></i>';
    super(options);
    this.map = options.map;
    this.container = new Container({
      semantic: "section",
      className: `taskpane no-header`,
    });
    options.target.addControl(this.container);
    this.map = this.container.getMap();
    this.container.setVisible(this.active);
    this.on("change:active", (evt) => this.container.setVisible(evt.active));
    this.main = elt("main", { className: `main` });
    this.container.element.appendChild(this.main);
    this.image = elt("button", { className: "download-image" }, elt("i", { className: "far fa-arrow-to-bottom fa-fw" }));
    this.footer = elt("footer", { className: `footer ol-control` }, this.image, elt("button", { className: "button" }, "Button1"), elt("button", { className: "button" }, "Button2"));
    this.container.element.appendChild(this.footer);
    this.symbols = {
      polygon: new Polygon([
        [
          [0, 0],
          [16, 0],
          [16, 16],
          [0, 16],
          [0, 0],
        ],
      ]),
      linestring: new LineString([
        [0, 0],
        [16, 16],
      ]),
      point: new Point([16 / 2, 16 / 2]),
    };
    this.image.addEventListener("click", (evt) => this.getLegendImage(this.map.getView().getResolution()));
    this.setContent(this.map.getView().getResolution());
    this.map.getView().on("change:resolution", (evt) => this.setContent(evt.target.getResolution()));
  }
  /**
   *Style icon
   *
   * @param {Array} style
   * @memberof Legend
   * @return {Promise}
   */

  drawIcon(style, label, thematic, visible) {
    if (!style || style.length) return;
    return new Promise((resolve, reject) => {
      const icon = elt("canvas", { width: 16, height: 16 });
      const ctx = icon.getContext("2d");
      const vctx = toContext(ctx, {
        size: [16, 16],
      });
      vctx.setStyle(style);
      if (style.getFill()) vctx.drawGeometry(this.symbols.polygon);
      if (!style.getFill() && style.getStroke()) vctx.drawGeometry(this.symbols.linestring);
      if (style.getImage() && style.getImage() instanceof Icon) {
        const img = new Image();
        img.addEventListener("load", () => {
          ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, 16, 16);
          resolve({ icon: icon, label: label, thematic: thematic, visible: visible });
        });
        img.src=style.getImage().getSrc()
      }
      vctx.drawGeometry(this.symbols.point);
      resolve({ icon: icon, label: label, thematic: thematic, visible: visible });
    });
  }
  loadImage(url, label, thematic, visible) {
    return new Promise((resolve, reject) => {
      const icon = elt("canvas", { width: 16, height: 16 });
      const ctx = icon.getContext("2d");
      const img = new Image();
      img.addEventListener("load", () => {
        ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, 16, 16);
        resolve({ icon: icon, label: label, thematic: thematic, visible: visible });
      });
      img.src = url;
    });
  }
  getStyles(layer, resolution) {
    if (layer instanceof VectorLayer) {
      if (!(layer.getStyle() && typeof layer.getStyle() === "function")) return;
      const styles = layer.getStyle().call(this, undefined, resolution);
      if (!Array.isArray(styles)) return;
      else return { thematic: styles.length > 1, styles: styles };
    } else return { thematic: false, styles: [] };
  }
  getLabels(layer) {
    const label = layer.get("label") || layer.get("name") || "";
    const imagisStyle = layer.get("imagis-style");
    const thematic = [];
    if (imagisStyle)
      for (const is of imagisStyle) {
        if (is.filter) thematic.push(`${is.filter.property} ${is.filter.operator}  ${is.filter.value} `);
      }
    return { label: label, thematic: thematic };
  }
  getItemsContent(resolution) {
    const promises = [];
    const layers = this.map
      .getLayers()
      .getArray()
      .sort((a, b) => (a.getZIndex() > b.getZIndex() ? 1 : -1))
      .reverse();
    for (const l of layers) {
      const labelsInfo = this.getLabels(l, this.getStyles(l, resolution));
      const stylesInfo = this.getStyles(l, resolution);
      const label = labelsInfo.label;
      const visible = l.getVisible() && resolution < l.getMaxResolution() && resolution > l.getMinResolution();
      if (!stylesInfo.styles.length) promises.push(this.loadImage(images.lc_raster, label, false, visible));
      if (stylesInfo.styles.length > 1) promises.push(this.loadImage(images.lc_theme, label, false, visible));
      for (const [i, style] of stylesInfo.styles.entries()) {
        if (labelsInfo.thematic[i]) label = labelsInfo.thematic[i];
        promises.push(this.drawIcon(style, label, labelsInfo.thematic.length !== 0, visible));
      }
    }
    return promises;
  }
  setContent(resolution) {
    const promises = this.getItemsContent(resolution);
    Promise.all(promises).then((r) => {
      this.main.innerHTML ='';
      for (const [i,row] of r.entries()) {
        console.log(i)
        const item = elt("div", { className: "item" }, row.icon, elt("span", {}));
        this.main.appendChild(item);
        if (row.visible) item.style.opacity = "1";
        else item.style.opacity = "0.4";
      
      }
    });
  }
  getLegendImage(resolution) {
    const promises = this.getItemsContent(resolution);
    const legendImage = (items) => {
      const canvas = elt("canvas", { width: 400, height: 18 * items });
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "black";
      ctx.textBaseline = "middle";
      return canvas;
    };
    Promise.all(promises).then((r) => {
      const canvas = legendImage(r.length);
      const ctx = canvas.getContext("2d");
      const vr = r.filter((x) => x.visible);
      for (const [i, v] of vr.entries()) {
        if (v.visible) console.log(i, v);
        if (v.thematic) {
          ctx.drawImage(v.icon, 16, i * 18);
          ctx.fillText(v.label, 40, i * 18 + 8);
        } else {
          ctx.drawImage(v.icon, 0, i * 18);
          ctx.fillText(v.label, 24, i * 18 + 8);
        }
      }
      const a = elt("a", { href: canvas.toDataURL(), download: "legend.png" });
      a.click();
      a.remove();
    });
  }
}
