import "ol/ol.css";
import "@fortawesome/fontawesome-pro/css/fontawesome.css";
import "@fortawesome/fontawesome-pro/css/regular.min.css";
import "./src/main.css";
import Map from "ol/Map";
import View from "ol/View";
import ScaleLine from "ol/control/ScaleLine";
import Rotate from "ol/control/Rotate";
import Zoom from "ol/control/Zoom";
import Projection from "ol/proj/Projection";
import { register } from "ol/proj/proj4.js";
import proj4 from "proj4";

import baseDef from "./def.json";
import Container from "./src/container";
import DefLayers from "./src/defLayers";
import DefEditor from "./src/defEditor";
import Toggle from "./src/toggle";

if (localStorage.getItem("def") === null) localStorage.setItem("def", JSON.stringify(baseDef));
const def = JSON.parse(localStorage.getItem("def"));
def.path = window.location.href.split("/").slice(0, -1).join("/"); //base url

proj4.defs("EPSG:3765", "+proj=tmerc +lat_0=0 +lon_0=16.5 +k=0.9999 +x_0=500000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
register(proj4);
const mapContainer = document.createElement("main");
mapContainer.className = "map";
document.body.appendChild(mapContainer);
const view = new View({
  center: def.center,
  zoom: def.zoom,
  projection: new Projection({
    //hr projection
    code: "EPSG:3765",
    units: "m",
    extent: [208311.05, 4614890.75, 724721.78, 5159767.36],
  }),
});
/**  ol/map*/
window.map = new Map({
  target: mapContainer,
  view: view,
  controls: [],
});

/**  load layers from def*/
const defLayers = new DefLayers({
  def: def,
  map: map,
});
defLayers.addTileLayers();
defLayers.addVectorLayers();

/** UX header */
const header = new Container({
  semantic: "header",
  className: "header",
});
map.addControl(header);
const gui = new Container({
  className: "ol-control",
});
header.addControl(gui);

/** UX gui control */
const toggleHome = new Toggle({
  html: '<i class="far fa-home"></i>',
  className: "toggle-home",
  tipLabel: "Opći alati",
});
gui.addControl(toggleHome);
toggleHome.on("change:active", (evt) => {
  sectionHome.setActive(evt.active);
});

/** UX left & right side controls */
const aside = new Container({
  semantic: "aside",
  className: "aside",
});
map.addControl(aside);

/** UX left side controls children of aside */
const sectionHome = new Container({
  semantic: "section",
  className: "section home",
});
aside.addControl(sectionHome);

/** UX left side control child of section */
const taskpaneHome = new Container({
  semantic: "section",
  className: "taskpane home",
});
sectionHome.addControl(taskpaneHome);
taskpaneHome.addControl(
  new DefEditor({
    def: def,
  })
);
const navHome = new Container({
  semantic: "nav",
  className: "nav home ol-control",
});
sectionHome.addControl(navHome);
const defEditor = new Toggle({
  html: '<i class="far fa-brackets-curly"></i>',
  className: "toggle-defEditor",
  tipLabel: "Def editor",
});
navHome.addControl(defEditor);
defEditor.on("change:active", (evt) => {
  taskpaneHome.setActive(evt.active);
});
const legend = new Toggle({
  html: '<i class="far fa-layer-group"></i>',
  className: "toggle-legend",
  tipLabel: "Legenda",
});
navHome.addControl(legend);
legend.on("change:active", (evt) => {
  //taskpaneHome.setActive(evt.active);
});

/** UX right side control child of aside */
const navRight = new Container({
  semantic: "nav",
  className: "nav-right",
});
aside.addControl(navRight);
navRight.addControl(
  new Rotate({
    tipLabel: "Sjever gore",
  })
);
navRight.addControl(new Zoom());

/** UX footer control */
const footer = new Container({
  semantic: "footer",
  className: "footer",
});
map.addControl(footer);
footer.addControl(new ScaleLine());
