const dimensions = [
            "MP Count (Fiber)",
            "MP Count (Fragment)",
            "MP Count (Bead)",
            "MP Count (Film)",
            "MP Count (Foam)"
        ];

const mpIngestionWidth = 530, mpIngestionHeight = 460, radius = 200, levels = 5;
const angleSlice = (Math.PI * 2) / dimensions.length;
const rScale = d3.scaleLinear().range([0, radius]);
const color = d3.scaleOrdinal(d3.schemeCategory10);

const svg = d3.select("#mp-ingestion-chart")
    .append("svg")
    .attr("width", mpIngestionWidth)
    .attr("height", mpIngestionHeight)
    .append("g")
    .attr("transform", `translate(${mpIngestionWidth / 2}, ${mpIngestionHeight / 2})`);

    let tooltip_radar = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip_radar");

d3.csv("data/csv/microplastic-count.csv").then(data => {
    data.forEach((d, i) => d.ID = `${d.Species}_${i + 1}`);

    const speciesList = Array.from(new Set(data.map(d => d.Species)));
    const speciesSelect = d3.select("#speciesSelect");

    speciesList.forEach(s => {
        speciesSelect.append("option").attr("value", s).text(s);
    });

    function drawRadar(selectedSpecies, numAnimals) {
        svg.selectAll("*").remove();

        const filtered = data.filter(d => d.Species === selectedSpecies).slice(0, numAnimals);
        const maxVal = d3.max(filtered.flatMap(d => dimensions.map(dim => +d[dim])));
        rScale.domain([0, maxVal]);
        dimensions.forEach((dim, i) => {
            const angle = i * angleSlice - Math.PI / 2;
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);
            svg.append("line")
                .attr("x1", 0).attr("y1", 0)
                .attr("x2", x).attr("y2", y)
                .attr("color","white")
                .attr("stroke", "#fff");

            svg.append("text")
                .attr("x", x * 1.1).attr("y", y * 1.1)
                .attr("text-anchor", "middle")
                .attr("fill", "white")
                .attr("font-size", "12px")
                .text(dim);
        });

        const line = d3.lineRadial()
            .radius(d => rScale(d.value))
            .angle((d, i) => i * angleSlice);

        filtered.forEach((animal, idx) => {
            const values = dimensions.map((dim, i) => ({ axis: dim, value: +animal[dim] }));

            svg.append("path")
                .datum(values)
                .attr("fill", color(idx))
                .attr("fill-opacity", 0.2)
                .attr("stroke", color(idx))
                .attr("stroke-width", 1.5)
                .attr("d", line)
                .style("pointer-events", "none");

            svg.selectAll(".dot-" + idx)
                .data(values)
                .enter()
                .append("circle")
                .attr("r", 6)
                .attr("cx", (d, i) => rScale(d.value) * Math.cos(i * angleSlice - Math.PI / 2))
                .attr("cy", (d, i) => rScale(d.value) * Math.sin(i * angleSlice - Math.PI / 2))
                .attr("fill", color(idx))
                .attr("fill-opacity", 0.8)
                .attr("stroke", "#fff")
                .attr("stroke-width", 1.2)
                .on("mouseover", (event, d) => {
                    tooltip_radar.transition().duration(100).style("opacity", 1);
                    tooltip_radar.html(`<b>${animal.ID}</b><br/>${d.axis}: ${d.value}`)
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 20) + "px");
                })
                .on("mouseout", () => {
                    tooltip_radar.transition().duration(150).style("opacity", 0);
                });
        });
    }
    const updateChart = () => {
        const species = speciesSelect.node().value;
        const count = +d3.select("#countSelect").node().value;
        drawRadar(species, count);
    };

    speciesSelect.on("change", updateChart);
    d3.select("#countSelect").on("change", updateChart);

    drawRadar(speciesList[0], 10);
});