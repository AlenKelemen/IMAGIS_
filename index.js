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
import Select from "ol/interaction/Select";

import baseDef from "./def.json";
import epsg3765 from "./src/EPSG3765";
import Container from "./src/container";
import Toggle from "./src/toggle";
import DefLayers from "./src/defLayers";
import Geolocator from "./src/geoloc";
import Legend from "./src/legend";
import Theme from "./src/theme.js";
import Properties from "./src/properties.js";
import DefEditor from "./src/defEditor";
import SelectInfo from "./src/selectInfo";
import SelectRect from "./src/selectRect";
import SelectEx from "./src/selectEx";

/**  local project def*/
if (localStorage.getItem("def") === null) localStorage.setItem("def", JSON.stringify(baseDef));
const def = JSON.parse(localStorage.getItem("def"));
/** map contaner */
const mapContainer = document.createElement("main");
mapContainer.className = "map";
document.body.appendChild(mapContainer);

/**  ol/map*/
window.map = new Map({
  target: mapContainer,
  view: new View({
    center: def.center,
    zoom: def.zoom,
    projection: new epsg3765(),
  }),
  controls: [],
});

/**  load layers from def*/
const defLayers = new DefLayers({
  def: def,
  map: map,
});
defLayers.addTileLayers();
defLayers.addVectorLayers();
defLayers.addTHLayers();

/** UX header control */
const header = new Container({
  semantic: "header",
  className: "header",
});
map.addControl(header);
const nav = new Container({
  className: "ol-control",
});
header.addControl(nav);

/** UX home control */
const toggleHome = new Toggle({
  html: '<i class="far fa-home"></i>',
  className: "toggle-home",
  tipLabel: "Opći alati",
});
nav.addControl(toggleHome);
toggleHome.on("change:active", (evt) => {
  sectionHome.setActive(evt.active);
});

/** aside: UX left & right side controls contaner */
const aside = new Container({
  semantic: "aside",
  className: "aside",
});
map.addControl(aside);

/** UX left side controls, children of aside */
/**Home */
const sectionHome = new Container({
  semantic: "section",
  className: "section home",
});
aside.addControl(sectionHome);
const navHome = new Container({
  semantic: "nav",
  className: "nav home ol-control",
});
sectionHome.addControl(navHome);
/** Home content */
const legend = new Legend({
  html: '<i class="far fa-layer-group"></i>',
  tipLabel: "Legenda & upravljanje kartom",
  target: sectionHome,
  contanerClassName: "legend",
});
navHome.addControl(legend);

const theme = new Theme({
  html: '<i class="far fa-images"></i>',
  tipLabel: "Tema i stil",
  target: sectionHome,
  contanerClassName: "theme",
  def: def,
  layer: (() => {
    map
      .getLayers()
      .getArray()
      .find((x) => x.get("active"));
  })(),
  callback: (def, layer) => defEditor.setDef(def),
});
map.getLayers().on("propertychange", (evt) => {
  theme.setLayer(evt.target.get("active"));
});
navHome.addControl(theme);

const properties = new Properties({
  html: '<i class="far fa-info-circle"></i>',
  tipLabel: "Info",
  target: sectionHome,
  contanerClassName: "properties",
});
navHome.addControl(properties);

const selectEx = new SelectEx({
  html: '<i class="far fa-object-ungroup"></i>',
  tipLabel: "Prošireni odabir",
  target: sectionHome,
  contanerClassName: "select-ex",
});
navHome.addControl(selectEx);



const defEditor = new DefEditor({
  html: '<i class="far fa-brackets-curly"></i>',
  tipLabel: "Uređenje karte",
  target: sectionHome,
  def: def,
  contanerClassName: "def-editor",
});
navHome.addControl(defEditor);
/** UX right side control, child of aside */
const navRight = new Container({
  semantic: "nav",
  className: "nav-right",
});
aside.addControl(navRight);
const rotateZoom = new Container({
  semantic: "nav",
  className: "nav-rotateZoom",
});
navRight.addControl(rotateZoom);
rotateZoom.addControl(
  new Rotate({
    tipLabel: "Sjever gore",
  })
);
rotateZoom.addControl(new Zoom());
/** geolocate control, rightside child of aside */
const geolocator = new Geolocator({
  map: map,
  className: "geolocator ol-control",
  html: '<i class="far fa-map-marker-alt"></i>',
  tipLabel: "Pokaži moju lokaciju",
});
navRight.addControl(geolocator);

/** select control, rightside child of aside */
const select = new Select();
map.addInteraction(select);
select.setActive(false);
const selectContaner = new Container({
  semantic: "nav",
  className: "nav-select ol-control",
});
navRight.addControl(selectContaner);
const selectToggle = new Toggle({
  html: '<i class="far fa-mouse-pointer"></i>',
  className: "select",
  tipLabel: "Odaberi",
});
selectContaner.addControl(selectToggle);

selectToggle.on("change:active", (evt) => {
  select.setActive(evt.active);
});
const selectRectToggle = new Toggle({
  html: '<i class="far fa-lasso"></i>',
  className: "select-ex",
  tipLabel: "Odaberi na druge načine",
});
selectContaner.addControl(selectRectToggle);
const selectRect = new SelectRect({
  select:select
});
selectRectToggle.on("change:active", (evt) => {
  if (evt.active) {
    map.addInteraction(selectRect);
    selectEx.menu.deactivateControls();
  }
  else map.removeInteraction(selectRect);

});

/** UX footer control */
const footer = new Container({
  semantic: "footer",
  className: "footer",
});
map.addControl(footer);
legend.activeLayerInfo({
  className: "active-layer-info ol-control",
  targetControl: footer,
});
const selectInfo = new SelectInfo({
  select: select,
  className: "select-info",
});
footer.addControl(selectInfo);
footer.addControl(new ScaleLine());
