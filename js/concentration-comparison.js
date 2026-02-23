const connectedDotPlotTooltip = d3.select("#concentration-tooltip");

d3.csv("data/csv/concentrations-over-years.csv", d3.autoType).then(rawData => {
    const data = Array.from(
        d3.group(rawData, d => d.Organ),
        ([organ, records]) => {
            const entry = { organ };
            records.forEach(d => {
                entry[`year${d.Year}`] = d.Concentration;
            });
            return entry;
        }
    );

    const connectedDotPlotSvg = d3.select("#concentration-chart");
    const connectedDotPlotWidth = +connectedDotPlotSvg.attr("width");
    const connectedDotPlotHeight = +connectedDotPlotSvg.attr("height");

    const connectedDotPlotMargin = { top: 60, bottom: 60, left: 80, right: 80 };
    const connectedDotPlotInnerWidth = connectedDotPlotWidth - connectedDotPlotMargin.left - connectedDotPlotMargin.right;
    const connectedDotPlotInnerHeight = connectedDotPlotHeight - connectedDotPlotMargin.top - connectedDotPlotMargin.bottom;

    const g = connectedDotPlotSvg.append("g").attr("transform", `translate(${connectedDotPlotMargin.left}, ${connectedDotPlotMargin.top})`);

    const connectedDotPlotColorScale = d3.scaleOrdinal()
        .domain(data.map(d => d.organ))
        .range(["#f39c12", "#e74c3c", "#3498db"]);

    const maxValue = d3.max(data, d => Math.max(d.year2016, d.year2024));

    const yScale = d3.scaleLinear()
        .domain([0, maxValue])
        .range([connectedDotPlotInnerHeight, 0]);

    const xScale = d3.scalePoint()
        .domain(data.map(d => d.organ))
        .range([0, connectedDotPlotInnerWidth])
        .padding(0.5);

    const radiusScale = d3.scaleSqrt()
        .domain([100, 5000])
        .range([4, 20]);

    // y axis lines
    const yTop = connectedDotPlotInnerHeight;
    const yBottom = 0;

    g.append("line")
        .attr("x1", 0)
        .attr("y1", yTop)
        .attr("x2", connectedDotPlotInnerWidth)
        .attr("y2", yTop)
        .attr("stroke", "#555")
        .attr("stroke-width", 1);

    g.append("line")
        .attr("x1", 0)
        .attr("y1", yBottom)
        .attr("x2", connectedDotPlotInnerWidth)
        .attr("y2", yBottom)
        .attr("stroke", "#555")
        .attr("stroke-width", 1);

    // Group to animate later
    const dotGroup = g.append("g").attr("class", "dot-group");

    data.forEach((d, i) => {
        const x = xScale(d.organ);
        const y1 = yScale(d.year2016);
        const y2 = yScale(d.year2024);

        // Fold line
        dotGroup.append("path")
            .attr("d", `M${x},${y1} C${x},${(y1 + y2) / 2} ${x},${(y1 + y2) / 2} ${x},${y2}`)
            .attr("class", "fold-line")
            .attr("stroke", connectedDotPlotColorScale(d.organ))
            .attr("fill", "none")
            .attr("stroke-width", 2)
            .attr("opacity", 0);

        // 2016 dot
        dotGroup.append("circle")
            .attr("cx", x)
            .attr("cy", connectedDotPlotInnerHeight) 
            .attr("r", 0)
            .attr("fill", d3.color(connectedDotPlotColorScale(d.organ)).darker(1))
            .attr("class", "dot")
            .on("mouseover", () => {
                connectedDotPlotTooltip
                    .style("opacity", 1)
                    .html(`${d.organ}: 2016<br>Concentration: ${d.year2016.toFixed(2)}`);
            })
            .on("mousemove", (event) => {
                connectedDotPlotTooltip
                    .style("left", event.pageX + 10 + "px")
                    .style("top", event.pageY - 28 + "px");
            })
            .on("mouseout", () => connectedDotPlotTooltip.style("opacity", 0))
            .attr("data-final-cy", y1)
            .attr("data-final-r", radiusScale(d.year2016));

        // 2024 dot
        dotGroup.append("circle")
            .attr("cx", x)
            .attr("cy", connectedDotPlotInnerHeight)
            .attr("r", 0)
            .attr("fill", d3.color(connectedDotPlotColorScale(d.organ)).brighter(1.5))
            .attr("class", "dot")
            .on("mouseover", () => {
                connectedDotPlotTooltip
                    .style("opacity", 1)
                    .html(`${d.organ}: 2024<br>Concentration: ${d.year2024.toFixed(2)}`);
            })
            .on("mousemove", (event) => {
                connectedDotPlotTooltip
                    .style("left", event.pageX + 10 + "px")
                    .style("top", event.pageY - 28 + "px");
            })
            .on("mouseout", () => connectedDotPlotTooltip.style("opacity", 0))
            .attr("data-final-cy", y2)
            .attr("data-final-r", radiusScale(d.year2024));

        // Organ label
        g.append("text")
            .attr("class", "organ-label")
            .attr("x", x)
            .attr("y", connectedDotPlotInnerHeight + 25)
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .text(d.organ);
    });

    drawLegend(connectedDotPlotSvg, radiusScale);

    const chartElement = document.getElementById("concentration-chart");
    let animationTriggered = false;

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting && entry.intersectionRatio > 0.5 && !animationTriggered) {
                animateDots();
                animationTriggered = true;
            }
        });
    }, {
        threshold: [0, 0.5, 1]
    });

    observer.observe(chartElement);

    function animateDots() {
        dotGroup.selectAll("circle")
            .transition()
            .duration(1000)
            .attr("cy", function () {
                return +this.getAttribute("data-final-cy");
            })
            .attr("r", function () {
                return +this.getAttribute("data-final-r");
            });

        dotGroup.selectAll(".fold-line")
            .transition()
            .duration(800)
            .attr("opacity", 1);
    }
});

function drawLegend(svg, radiusScale) {
    const legend = svg.append("g")
        .attr("transform", "translate(870, 100)");

    const valuesToShow = [500, 2000, 4000];
    const spacing = 40;

    legend.selectAll("circle")
        .data(valuesToShow)
        .enter()
        .append("circle")
        .attr("cy", (d, i) => i * spacing)
        .attr("r", d => radiusScale(d))
        .attr("fill", "none")
        .attr("stroke", "#C0C0C0");

    legend.selectAll("line")
        .data(valuesToShow)
        .enter()
        .append("line")
        .attr("x1", d => radiusScale(d))
        .attr("x2", 80)
        .attr("y1", (d, i) => i * spacing)
        .attr("y2", (d, i) => i * spacing)
        .attr("stroke", "#C0C0C0")
        .style("stroke-dasharray", "2,2");

    legend.selectAll("text")
        .data(valuesToShow)
        .enter()
        .append("text")
        .attr("x", 85)
        .attr("y", (d, i) => i * spacing)
        .attr("alignment-baseline", "middle")
        .attr("fill", "#C0C0C0")
        .style("font-size", "12px")
        .text(d => d);

    legend.append("text")
        .attr("x", -10)
        .attr("y", -spacing / 2)
        .attr("text-anchor", "start")
        .attr("fill", "#C0C0C0")
        .style("font-size", "13px")
        .text("Concentration in µg/g");
}
