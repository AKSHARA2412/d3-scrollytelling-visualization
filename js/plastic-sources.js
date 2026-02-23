const plasticIndContributorsSvg = d3.select("#plastic-sources");

plasticIndContributorsSvg
  .attr("width", 800)
  .attr("height", 600)
  .style("background-color", "#0a3b4e")
  .style('box-shadow', '0 4px 12px rgba(0, 0, 0, 0.1)');

let amplitude = 0;
let frequency = 0;
let maxAmplitude = 100;

const padding = 40;

d3.csv("data/csv/plastic-producers.csv").then((dataset) => {
  dataset.forEach((d, i) => {
    d.Production_MMT_2019 = +d.Production_MMT_2019;
    d.x =
      padding +
      (i / (numPoints - 1)) * (800 - 2 * padding);
    d.y = 300 - maxAmplitude;
  });

  plasticIndContributorsSvg
    .selectAll("circle.row1")
    .data(dataset)
    .join("circle")
    .attr("cx", (d) => d.x)
    .attr("cy", (d) => d.y)
    .attr("r", 5)
    .attr("fill", "#fff")
    .on("mouseover", (event, d) => {
      maxAmplitude = d.Production_MMT_2019 * 8.5;
    });

  plasticIndContributorsSvg
    .selectAll("text.row1")
    .data(dataset)
    .join("text")
    .attr("x", (d, i) => d.x)
    .attr("y", (d, i) => d.y - 80)
    .attr("text-anchor", "middle")
    .attr("transform", (d, i) => `rotate(-90, ${d.x}, ${d.y - 80})`)
    .text((d) => d["Company"])
    .attr("font-size", "10px")
    .attr("fill", "#fff");
});

d3.csv("data/csv/plastic-producers-brands.csv").then((dataset) => {
  const padding = 40;
  dataset.forEach((d, i) => {
    d.Plastic_Packaging_Weight_tonnes =
      +d.Plastic_Packaging_Weight_tonnes;
    d.x =
      padding +
      (i / (numPoints - 1)) * (800 - 2 * padding);
    d.y = 500 - maxAmplitude;
  });

  plasticIndContributorsSvg
    .selectAll("circle.row2")
    .data(dataset)
    .join("circle")
    .attr("cx", (d) => d.x)
    .attr("cy", (d) => d.y)
    .attr("r", 5)
    .attr("fill", "#fff")
    .on("mouseover", (event, d) => {
      maxAmplitude = d.Plastic_Packaging_Weight_tonnes * 0.00003;
    });

  plasticIndContributorsSvg
    .selectAll("text.row2")
    .data(dataset)
    .join("text")
    .attr("x", (d, i) => d.x)
    .attr("y", (d, i) => d.y + 80)
    .attr("text-anchor", "middle")
    .attr("transform", (d, i) => `rotate(-90, ${d.x}, ${d.y + 80})`)
    .text((d) => d["Brand"])
    .attr("font-size", "10px")
    .attr("fill", "#fff");
});

const minAmplitude = 0;
const numPoints = 20;
const lineData = d3.range(numPoints).map((d, i) => ({
  x: (i / (numPoints - 1)) * 800,
  y: 400,
}));

const line = d3
  .line()
  .x((d) => d.x)
  .y((d) => d.y);

const path = plasticIndContributorsSvg
  .append("path")
  .datum(lineData)
  .attr("d", line)
  .attr("fill", "none")
  .attr("stroke", "red")
  .attr("stroke-width", 2);

function animateLine() {
  lineData.forEach((point, i) => {
    const change =
      (Math.random() - 0.5) *
      2 *
      amplitude *
      Math.sin(frequency + i * 0.2);
    point.y = 300 + change;
  });

  amplitude = maxAmplitude;

  path.attr("d", line);
  frequency = (frequency + 0.4) % (2 * Math.PI);
  requestAnimationFrame(animateLine);
}

animateLine();