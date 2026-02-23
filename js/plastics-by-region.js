document.addEventListener("DOMContentLoaded", () => {
    d3.csv("data/csv/global-plastics-production.csv")
        .then((data) => {
            data.forEach((d) => {
                d.Year = +d.Year;
                d.production = +d["Annual plastic production between 1950 and 2019"];
            });
            renderWorldPollution(data);
            renderWorldMap(data);
        });
});

function renderWorldPollution(data) {
    let width = window.innerWidth;
    let height = window.innerHeight;

    let svg = d3.select("#plastic_by_region")
        .append("svg")
        .attr("width", width)
        .attr("height", 600);

    let tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background", "#fff")
        .style("padding", "5px")
        .style("border-radius", "5px")
        .style("border", "1px solid #000")
        .style("opacity", 0);

    let xAxis = svg.append("line")
        .attr("x1", 0)
        .attr("y1", 565)
        .attr("x2", width)
        .attr("y2", 565)
        .attr("stroke", "#000")
        .attr("stroke-width", 2)
        .attr("opacity", 0.2);

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", 600)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("fill", "#333")
        .text("World Plastic Pollution");

    let yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.production)])
        .range([565, 20]);

    let yAxis = d3.axisLeft(yScale)
        .ticks(10)
        .tickPadding(10);

    svg.append("g")
        .attr("transform", `translate(${width - 5}, 0)`)
        .attr("opacity", 0.5)
        .call(yAxis);

    data.forEach((d, i) => {
        svg.append("text")
            .attr("x", (i + 1) * (width / (data.length + 2)))
            .attr("y", 580)
            .attr("text-anchor", "middle")
            .attr("font-size", "9px")
            .attr("fill", "#333")
            .attr("transform", `rotate(90, ${(i + 1) * (width / (data.length + 2))}, 580)`)
            .text(d.Year);
        if (i > 0) {
            svg.append("line")
                .attr("x1", (i) * (width / (data.length + 2)))
                .attr("y1", yScale(data[i - 1].production))
                .attr("x2", (i + 1) * (width / (data.length + 2)))
                .attr("y2", yScale(d.production))
                .attr("stroke", "black")
                .attr("stroke-width", 1)
                .on("mouseover", (event) => {
                    tooltip.style("opacity", 1)
                        .html(`Year: ${d.Year}<br>Production: ${d.production} tons`)
                        .style("left", `${event.pageX + 10}px`)
                        .style("top", `${event.pageY - 20}px`);
                })
                .on("mousemove", (event) => {
                    tooltip.style("left", `${event.pageX + 10}px`)
                        .style("top", `${event.pageY - 20}px`);
                })
                .on("mouseout", () => {
                    tooltip.style("opcacity", 0);
                });
        }
    });

    document.addEventListener("resize", () => {
        width = window.innerWidth;
        let svg = d3.select("#plastic_by_region svg");
        svg.attr("width", width);
    });
}

function renderWorldMap(data) {
    let width = 1100;
    let height = 500;

    let svg = d3.select("#plastic_by_region svg");

    let projection = d3.geoOrthographic()
        .scale(250)
        .translate([width / 4, height / 2])
        .clipAngle(90);

    let path = d3.geoPath().projection(projection);

    d3.json("data/json/countries.geo.json")
        .then((world) => {
            svg.append("g")
                .selectAll("path")
                .data(world.features)
                .join("path")
                .attr("d", path)
                .attr("fill", "#fff")
                .attr("stroke", "#000")
                .attr("stroke-width", 0.5)
                .on("click", (event, d) => {
                    let countryName = d.properties.name;
                    renderLineGraph(d);
                });
        });

    // Add drag behavior for rotating the globe
    let drag = d3.drag()
        .on("drag", (event) => {
            let rotate = projection.rotate();
            let k = 0.5; // Sensitivity
            projection.rotate([rotate[0] + event.dx * k, rotate[1] - event.dy * k]);
            svg.selectAll("path").attr("d", path);
        });

    svg.call(drag);
}

function renderLineGraph(selectedCountry) {
    let width = window.innerWidth;
    let height = window.innerHeight;
    d3.csv("data/csv/plastic-waste-exports.csv")
        .then((regions) => {
            let countryData = regions.filter(region => region.Entity.toLowerCase() === selectedCountry.properties.name.toLowerCase());

            countryData.forEach((d) => {
                d.Year = +d.Year;
                d.Exports = +d.Exports;
            });

            let xScale = d3.scaleLinear()
                .domain(d3.extent(countryData, d => d.Year))
                .range([0, width / 2]);

            let yScale = d3.scaleLinear()
                .domain([0, d3.max(countryData, d => d.Exports)])
                .range([0, 300 - 50]);

            let svg = d3.select("#plastic_by_region svg");
            svg.select(".country_output").remove();

            let country_output = svg.append("g")
                .attr("class", "country_output");

            let tooltip = d3.select("body")
                .append("div")
                .attr("class", "tooltip")
                .style("position", "absolute")
                .style("background", "#fff")
                .style("padding", "5px")
                .style("border-radius", "5px")
                .style("border", "1px solid #ccc")
                .style("opacity", 0);

            country_output.selectAll("*").remove();

            country_output.append("text")
                .attr("x", 5 * width / 8)
                .attr("y", 10)
                .attr("text-anchor", "middle")
                .attr("font-size", "12px")
                .text(selectedCountry.properties.name);

            country_output.append("text")
                .attr("x", 3 * width / 8 + 15)
                .attr("y", (300-50)/2 + 35)
                .attr("text-anchor", "middle")
                .attr("font-size", "12px")
                .attr("transform", `rotate(-90, ${3 * width / 8 - 10}, ${(300 - 50) / 2 + 35})`)
                .text("Plastic waste exports (tons)");

            country_output.append("g")
                .attr("transform", `translate(${3 * width / 8 + 35}, 35)`)
                .call(d3.axisTop(xScale));

            country_output.append("g")
                .attr("transform", `translate(${3 * width / 8 + 35}, 35)`)
                .call(d3.axisLeft(yScale));

            let lineGenerator = d3.line()
                .x(d => xScale(d.Year))
                .y(d => yScale(d.Exports));

            country_output.selectAll(".line")
                .data([countryData])
                .join("path")
                .attr("fill", "none")
                .attr("stroke", "#000")
                .attr("stroke-width", 1)
                .attr("d", lineGenerator)
                .attr("transform", `translate(${3 * width / 8 + 35}, 35)`);

            country_output.selectAll(".dot")
                .data(countryData)
                .join("circle")
                .attr("class", "dot")
                .attr("cx", d => xScale(d.Year) + 3 * width / 8 + 35)
                .attr("cy", d => yScale(d.Exports) + 35)
                .attr("r", 1.5)
                .attr("fill", "#000")
                .on("mouseover", (event, d) => {
                    tooltip.style("opacity", 1)
                        .html(`Year: ${d.Year}<br>Exports: ${d.Exports} tons`)
                        .style("left", `${event.pageX + 10}px`)
                        .style("top", `${event.pageY - 20}px`);
                })
                .on("mousemove", (event) => {
                    tooltip.style("left", `${event.pageX + 10}px`)
                        .style("top", `${event.pageY - 20}px`);
                })
                .on("mouseout", () => {
                    tooltip.style("opacity", 0);
                });
        });
}