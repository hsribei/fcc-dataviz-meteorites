import * as d3 from "d3";
import * as topojson from "topojson-client";
import "./style.css";

const width = 960;
const height = 500;
const rotate = 50;
const maxLat = 83;

let svg = null;

const projection = d3
  .geoMercator()
  .rotate([rotate, 0])
  .scale(1)
  .translate([width / 2, height / 2]);

const path = d3.geoPath(projection);

// Find the top left and bottom right of current projection
function mercatorBounds() {
  const yaw = projection.rotate()[0];
  const xyMax = projection([-yaw + 180 - 1e-6, -maxLat]);
  const xyMin = projection([-yaw - 180 + 1e-6, maxLat]);

  return [xyMin, xyMax];
}

// Set up the scale extent and initial scale for the projection
const b = mercatorBounds();
const s = width / (b[1][0] - b[0][0]);
const scaleExtent = [s, 10 * s];

projection.scale(scaleExtent[0]);

const zoom = d3.zoom().on("zoom", () => {
  svg.attr("transform", d3.event.transform);
});

document.addEventListener("DOMContentLoaded", () => {
  svg = d3
    .select("svg")
    .call(zoom)
    .append("g");

  d3
    .queue()
    .defer(d3.json, "https://unpkg.com/world-atlas@1/world/110m.json")
    .defer(
      d3.json,
      "https://raw.githubusercontent.com/FreeCodeCamp/ProjectReferenceData/master/meteorite-strike-data.json"
    )
    .await(ready);

  function ready(error, world, meteorites) {
    if (error) {
      throw error;
    }
    const countriesData = topojson.feature(world, world.objects.countries);

    svg
      .append("path")
      .attr("class", "map")
      .data([countriesData])
      .attr("fill", "white")
      .attr("stroke", "#333");

    svg.selectAll(".map").attr("d", path);

    svg
      .append("path")
      .datum(meteorites)
      .attr("d", path);
  }
});
