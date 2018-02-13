import "./style.css";
import * as d3 from "d3";
import * as topojson from "topojson-client";

const width = 960,
  height = 500,
  rotate = 50,
  maxLat = 83;

let svg = null;

const projection = d3
  .geoMercator()
  .rotate([rotate, 0])
  .scale(1)
  .translate([width / 2, height / 2]);

const path = d3.geoPath(projection);

// Find the top left and bottom right of current projection
function mercatorBounds(projection, maxLat) {
  const yaw = projection.rotate()[0],
    xyMax = projection([-yaw + 180 - 1e-6, -maxLat]),
    xyMin = projection([-yaw - 180 + 1e-6, maxLat]);

  return [xyMin, xyMax];
}

// Set up the scale extent and initial scale for the projection
const b = mercatorBounds(projection, maxLat),
  s = width / (b[1][0] - b[0][0]),
  scaleExtent = [s, 10 * s];

projection.scale(scaleExtent[0]);

const zoom = d3
  .zoom()
  .scaleExtent(scaleExtent)
  .on("zoom", redraw);

// Track last translation and scaling event we processed
let lastTranslate = { x: 0, y: 0 },
  lastScale = null;

function redraw() {
  if (d3.event) {
    const transform = d3.event.transform;
    const scale = transform.k;
    const translate = (({ x, y }) => ({ x, y }))(transform); // pick x and y

    // If scaling changes, ignore translation (otherwise touch zooms are
    // weird)
    if (scale != lastScale) {
      projection.scale(scale);
    } else {
      let dx = translate.x - lastTranslate.x,
        dy = translate.y - lastTranslate.y;
      const yaw = projection.rotate()[0],
        tp = projection.translate();

      // Use x translation to rotate based on current scale
      projection.rotate([
        yaw + 360.0 * dx / width * scaleExtent[0] / scale,
        0,
        0
      ]);

      // Use y translation to translate projection, clamped by min/max
      const b = mercatorBounds(projection, maxLat);
      if (b[0][1] + dy > 0) {
        dy = -b[0][1];
      } else if (b[1][1] + dy < height) {
        dy = height - b[1][1];
      }
      projection.translate(tp[0], tp[1] + dy);
    }

    // Save last values. Resetting zoom.translate() and scale() would seem
    // equivalent but doesn't seem to work reliably.
    lastScale = scale;
    lastTranslate = translate;
  }

  svg.selectAll("path").attr("d", path);
}

document.addEventListener("DOMContentLoaded", () => {
  svg = d3.select("svg").call(zoom);

  d3.json("https://unpkg.com/world-atlas@1/world/110m.json", (error, world) => {
    if (error) throw error;
    const countriesData = topojson.feature(world, world.objects.countries);

    svg
      .append("path")
      .data([countriesData])
      .attr("fill", "white")
      .attr("stroke", "#333");

    redraw();
  });
});

// Bibliography:
// - Pan and zoom adapted from http://bl.ocks.org/patricksurry/6621971
