import * as React from "react";
import ENERGY from "../../hud/jauges/jauge_energie.png";
import FOOD from "../../hud/jauges/jauge_food.png";
import HAPPINESS from "../../hud/jauges/jauge_hapiness.png";
import HEALTH from "../../hud/jauges/jauge_health.png";
import GaugeV2_Inner from "./GaugeV2_Inner";

const ICONS = {
  energy: ENERGY,
  food: FOOD,
  happiness: HAPPINESS,
  health: HEALTH,
};

const BASE_WIDTH = 876;
const BASE_HEIGHT = 240;
const INNER = { right: 520, y: 62, width: 620, height: 120 };
const INNER_SCALE = 0.18;

const OUTER_STYLE = {
  position: "relative",
  display: "block",
  width: "clamp(160px, 6vw, 360px)",
  aspectRatio: "876 / 240",
};

const IMG_STYLE = {
  position: "absolute",
  top: 0,
  left: 0,
  width: "fit-content",
  height: "100%",
  objectFit: "contain",
  imageRendering: "pixelated",
};

const INNER_WRAPPER_STYLE = {
  position: "absolute",
  right: `${(INNER.right / BASE_WIDTH) * 100}%`,
  top: `${(INNER.y / BASE_HEIGHT) * 100}%`,
  width: `${(INNER.width / BASE_WIDTH) * 100}%`,
  height: `${(INNER.height / BASE_HEIGHT) * 100}%`,
  transform: `scale(${INNER_SCALE})`,
  transformOrigin: "top right",
  zIndex: 2,
};

const GaugeV2 = React.memo(function GaugeV2({ value = 0, type = "energy" }) {
  const icon = ICONS[type];

  return (
    <div style={OUTER_STYLE}>
      <img src={icon} alt="gauge" style={IMG_STYLE} />
      <div style={INNER_WRAPPER_STYLE}>
        <GaugeV2_Inner value={value} />
      </div>
    </div>
  );
});

export default GaugeV2;
