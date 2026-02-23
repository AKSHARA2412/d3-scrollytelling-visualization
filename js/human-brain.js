const humanBrainSvg = d3.select("#brain-svg");

const humanBrainTooltip = d3
        .select("#human-brain")
        .append("div")
        .attr("class", "tooltip");
const slider = d3.select("#yearSlider");
const yearDisplay = d3.select("#sliderYear");

const humanBrainWidth = +humanBrainSvg.attr("width");
const humanBrainHeight = +humanBrainSvg.attr("height");

const container = humanBrainSvg.append("g");

// Setup zoom
const zoom = d3
            .zoom()
            .scaleExtent([1, 1])
            .on("zoom", (e) => {
                container.attr("transform", e.transform);
            });

humanBrainSvg.call(zoom);

container
    .append("image")
    .attr("xlink:href", "assets/images/brain_diagram_preview.png")
    .attr("x", 70)
    .attr("y", 0)
    .attr("width", 600)
    .attr("height", 600)
    .attr("opacity", 0.85);

container
    .attr("transform", "translate(0, -80)")
    .transition()
    .duration(1000)
    .ease(d3.easeCubicOut)
    .attr("transform", "translate(0, 50)")
    .transition()
    .duration(1000)
    .ease(d3.easeBounceOut)
    .attr("transform", "translate(0, 0)");

d3.json("data/json/microplastic-brain-impact-data.json").then(
(data) => {
    const nodes = data.slice(0, 10).map((d, i) => {
    const angle = (i / 10) * 2 * Math.PI;
    return {
        ...d,
        x: humanBrainWidth / 2 + Math.cos(angle) * 230,
        y: humanBrainHeight / 2 + Math.sin(angle) * 190,
    };
    });

    const links = d3.range(nodes.length - 1).map((i) => ({
        source: nodes[i],
        target: nodes[i + 1],
    }));

    container
        .selectAll("line.connection")
        .data(links)
        .enter()
        .append("line")
        .attr("class", "connection")
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y)
        .attr("stroke", "#00ff99")
        .attr("stroke-opacity", 0.2)
        .attr("stroke-width", 1);

    const colorScale = d3
        .scaleLinear()
        .domain([1, 12])
        .range(["#00ff99", "#ff4444"]);

    const sizeScale = d3.scaleLinear().domain([1, 12]).range([8, 40]);

    const nodeGroup = container
        .selectAll("g.node")
        .data(nodes)
        .enter()
        .append("g")
        .attr("class", "node")
        .attr("transform", (d) => `translate(${d.x},${d.y})`);

    // Background circle
    nodeGroup
        .append("circle")
        .attr("r", (d) =>
            sizeScale(d.microplastic_levels.final_concentration_mg_per_kg)
        )
        .attr("fill", (d) =>
            colorScale(d.microplastic_levels.final_concentration_mg_per_kg)
        )
        .attr("fill-opacity", 0.15);

    // Foreground circle with interactivity
    nodeGroup
        .append("circle")
        .attr("r", (d) =>
            sizeScale(d.microplastic_levels.initial_concentration_mg_per_kg)
        )
        .attr("fill", (d) =>
            colorScale(
            d.microplastic_levels.initial_concentration_mg_per_kg
            )
        )
        .attr("fill-opacity", 0.4)
        .attr("stroke", (d) =>
            colorScale(d.microplastic_levels.final_concentration_mg_per_kg)
        )
        .attr("stroke-width", 1)
        .on("mouseover", function (event, d) {
            d3.select(this)
            .transition()
            .duration(200)
            .attr("stroke-width", 3);
            humanBrainTooltip.transition().duration(200).style("opacity", 1);
            humanBrainTooltip
            .html(
                `<strong>${d.disease_name}</strong><br/>
            <em>${d.affected_brain_region}</em><br/><br/>
            📈 <b>${d.microplastic_levels.initial_year}:</b> ${d.microplastic_levels.initial_concentration_mg_per_kg} mg/kg<br/>
            📈 <b>${d.microplastic_levels.final_year}:</b> ${d.microplastic_levels.final_concentration_mg_per_kg} mg/kg<br/><br/>
            🧪 Symptom: ${d.initial_symptom_noticed}<br/>
            ⏱️ Full effect: ${d.duration_until_full_effect}`
            )
            .style("left", event.pageX + 15 + "px")
            .style("top", event.pageY - 40 + "px");
        })
        .on("mouseout", function () {
            d3.select(this)
            .transition()
            .duration(300)
            .attr("stroke-width", 1);
            humanBrainTooltip.transition().duration(300).style("opacity", 0);
        });

    nodeGroup
        .append("text")
        .attr("y", 4)
        .attr("class", "node-label")
        .text((d) => d.affected_brain_region);

    // Slider update
    slider.on("input", function () {
        const year = +this.value;
        yearDisplay.text(year);

        nodeGroup
            .selectAll("circle")
            .transition()
            .duration(500)
            .attr("fill-opacity", (d) =>
            year >= d.microplastic_levels.initial_year &&
                year <= d.microplastic_levels.final_year
                ? 0.4
                : 0.1
            );
    });
}
);