import "./style.css";
import * as d3 from "d3";
import * as topojson from "topojson-client";

document.addEventListener("DOMContentLoaded", () => {
  const context = d3
      .select("canvas")
      .node()
      .getContext("2d"),
    path = d3.geoPath(d3.geoOrthographic(), context);

  d3.json("https://unpkg.com/world-atlas@1/world/110m.json", (error, world) => {
    if (error) throw error;

    context.beginPath();
    path(topojson.mesh(world));
    context.stroke();
  });
});
