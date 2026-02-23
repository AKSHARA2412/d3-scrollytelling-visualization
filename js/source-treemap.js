const treemapWidth = 608;
const treemapHeight = 208;

document.addEventListener("DOMContentLoaded", function () {
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const tooltipTreemap = d3.select("#tooltip-treemap");
    fetch("data/json/microplastics-treemap-data.json")
    .then(response => response.json())
    .then(data => {
  
      const root = d3.hierarchy(data).sum(d => d.value)
  
      d3.treemap()
        .size([treemapWidth, treemapHeight])
        .padding(2)
        .round(true)(root);
  
      const chart = d3.select("#source-treemap");
  
      const nodes = chart.selectAll(".node")
        .data(root.leaves())
        .enter().append("div")
        .attr("class", "node")
        .style("left", d => `${d.x0}px`)
        .style("top", d => `${d.y0}px`)
        .style("width", d => `${d.x1 - d.x0}px`)
        .style("height", d => `${d.y1 - d.y0}px`)      
        .style("background", (d, i) => color(i))
        .on("mousemove", (event, d) => {
          tooltipTreemap
            .style("display", "block")
            .style("left", (event.pageX + 10) + "px")
            .style("color", "black")
            .style("background-color", "white")
            .style("top", (event.pageY - 10) + "px")
            .html(`<strong>${d.data.name}</strong><br/>${d.value.toFixed(2)} million tonnes`);
        })      
        .on("mouseout", () => tooltipTreemap.style("display", "none"));
  
      nodes.append("div")
        .attr("class", "node-label")
        .text(d => d.data.name);
    });
});
