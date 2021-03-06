import * as d3 from "d3";
import * as topojson from "topojson-client";
import { Spinner } from "spin.js";
import "./style.css";

const width = 960;
const height = 500;
const rotate = 50;
const maxLat = 83;

let spinner;

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
  const content = d3.select("#content");
  spinner = new Spinner({ color: "white", top: "33%" }).spin(content.node());

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
    spinner.stop();
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
    const mass = d => +d.properties.mass;

    const radius = d3
      .scaleSqrt()
      .domain(d3.extent(meteorites.features, mass))
      .range([2, 20]);

    function title(d) {
      const name = d.properties.name;
      const year = new Date(d.properties.year).getFullYear();
      const weight = d3.format(",")(+d.properties.mass / 1000);
      return `This meteor named "${name}" fell in ${year}, weighing ${weight} kg.`;
    }

    function biggerFirstToAvoidOcclusion(a, b) {
      return b.properties.mass - a.properties.mass;
    }

    const transform = d => {
      const centroid = path.centroid(d);
      return `translate(${centroid})`;
    };

    const removeWithoutLocation = d => !!d.geometry;

    svg
      .append("g")
      .attr("class", "bubble")
      .selectAll("circle")
      .data(
        meteorites.features
          .filter(removeWithoutLocation)
          .sort(biggerFirstToAvoidOcclusion)
      )
      .enter()
      .append("circle")
      .attr("transform", transform)
      .attr("r", d => radius(mass(d)))
      .on("mouseover", () => {
        d3.select(d3.event.target).attr("style", "stroke: white");
      })
      .on("mouseout", () => {
        d3.select(d3.event.target).attr("style", "stroke: none");
      })
      .append("title")
      .text(title);
  }
});
