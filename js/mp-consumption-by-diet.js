const heatmapMargin = { top: 150, right: 150, bottom: 50, left: 150 };
const heatmapWidth = 1200 - heatmapMargin.left - heatmapMargin.right;
const heatmapHeight = 600 - heatmapMargin.top - heatmapMargin.bottom;

const heatMapSvg = d3.select("#microplastics-heatmap")
    .attr("width", heatmapWidth + heatmapMargin.left + heatmapMargin.right)
    .attr("height", heatmapHeight + heatmapMargin.top + heatmapMargin.bottom)
    .append("g")
    .attr("transform", `translate(${heatmapMargin.left},${heatmapMargin.top})`);

const heatMapTooltip = d3.select("body").append("div")
    .attr("id", "microplastics-tooltip")
    .style("position", "absolute")
    .style("opacity", 0)
    .style("pointer-events", "none")
    .style("background", "rgba(0, 0, 0, 0.85)")
    .style("color", "#fff")
    .style("padding", "10px")
    .style("border-radius", "6px")
    .style("font-size", "12px")
    .style("width", "200px")
    .style("word-wrap", "break-word")
    .style("z-index", "1000");

d3.csv("data/csv/avg-mp-consumption-2018.csv").then(function(data) {
    const categories = Object.keys(data[0]).filter(d => d !== 'Country');
    const countries = data.map(d => d.Country);

    const heatmapData = [];
    data.forEach(d => {
        categories.forEach(cat => {
            heatmapData.push({
                country: d.Country,
                category: cat,
                value: +d[cat]
            });
        });
    });

    const x = d3.scaleBand()
        .domain(countries)
        .range([0, heatmapWidth])
        .padding(0.05);

    const y = d3.scaleBand()
        .domain(categories)
        .range([0, heatmapHeight])
        .padding(0.05);

    const color = d3.scaleSequential()
        .interpolator(d3.interpolatePlasma)
        .domain([d3.max(heatmapData, d => d.value), 0]); 

    heatMapSvg.selectAll("rect")
        .data(heatmapData)
        .enter().append("rect")
        .attr("x", d => x(d.country))
        .attr("y", d => y(d.category))
        .attr("width", x.bandwidth())
        .attr("height", y.bandwidth())
        .style("fill", d => color(d.value))
        .on("mouseover", function(event, d) {
            heatMapTooltip.transition().duration(200).style("opacity", 0.9);
            heatMapTooltip.html(`<strong>${d.country}</strong><br/>${d.category}: ${d.value.toFixed(2)}`);
        })
        .on("mousemove", function(event) {
            heatMapTooltip.style("left", `${event.pageX + 10}px`).style("top", `${event.pageY - 28}px`);
        })
        .on("mouseout", function() {
            heatMapTooltip.transition().duration(300).style("opacity", 0);
        });

    heatMapSvg.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(y));

    heatMapSvg.append("g")
        .attr("class", "x-axis")
        .call(d3.axisTop(x))
        .selectAll("text")
        .attr("transform", "rotate(270)")
        .attr("x", 10)
        .attr("y", 3)
        .style("text-anchor", "start")
        .style("font-size", "8px");

    const legendHeight = 300, legendWidth = 10;
    const legendSvg = d3.select("#microplastics-legend").append("svg")
        .attr("width", 100)
        .attr("height", legendHeight + 60); 

    const legendGradientId = "legend-gradient-vertical";

    const legendScale = d3.scaleLinear()
        .domain([d3.max(heatmapData, d => d.value), 0])
        .range([legendHeight, 0]);

    const legendAxis = d3.axisRight(legendScale)
        .ticks(6)
        .tickFormat(d3.format(".2f"));

    legendSvg.append("defs")
        .append("linearGradient")
        .attr("id", legendGradientId)
        .attr("x1", "0%").attr("y1", "100%")
        .attr("x2", "0%").attr("y2", "0%")
        .selectAll("stop")
        .data(d3.range(0, 1.01, 0.01))
        .enter().append("stop")
        .attr("offset", d => `${d * 100}%`)
        .attr("stop-color", d => color(color.domain()[0] + d * (color.domain()[1] - color.domain()[0])));

    legendSvg.append("text")
        .attr("x", 30 + legendWidth / 2)
        .attr("y", 10)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .style("font-weight", "bold");

    legendSvg.append("rect")
        .attr("x", 30)
        .attr("y", 20)
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", `url(#${legendGradientId})`)
        .style("stroke", "#ccc")
        .style("stroke-width", "1");

    legendSvg.append("g")
        .attr("transform", `translate(${30 + legendWidth}, 20)`)
        .call(legendAxis)
        .style("font-size", "10px");
});
