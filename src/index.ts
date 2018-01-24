import "./style.css";
import * as d3 from "d3";
import * as topojson from "topojson-client";

document.addEventListener("DOMContentLoaded", () => {
  const projection = d3.geoMercator();
  const svg = d3.select("svg");
  const path = d3.geoPath(projection);

  d3.json("https://unpkg.com/world-atlas@1/world/110m.json", (error, world) => {
    if (error) throw error;

    svg
      .append("path")
      .attr("d", path(topojson.feature(world, world.objects.countries)))
      .attr("fill", "white")
      .attr("stroke", "#333");
  });
});
