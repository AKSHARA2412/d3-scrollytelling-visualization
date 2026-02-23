const worldMapSvg = d3.select("#world-map"),
            worldMapWidth = +worldMapSvg.attr("width"),
            worldMapHeight = +worldMapSvg.attr("height");

        const projection = d3
            .geoNaturalEarth1()
            .scale(135)
            .translate([worldMapWidth / 2, worldMapHeight / 2]);

        //Assigning color
        const oceanColors = {
            "Atlantic Ocean": "#55a6df",
            "Pacific Ocean": "#ff7f0e",
            "Indian Ocean": "#2ca02c",
            "Arctic Ocean": "purple",
            "Southern Ocean": "#ba95dd",
        };

        d3.json("data/json/world.json").then(function (data) {
            // console.log(data)
            // Drawing the map
            worldMapSvg.append("g")
                .selectAll("path")
                .data(data.features)
                .join("path")
                .attr("fill", "white")
                .style("opacity", 0.9)
                .attr("d", d3.geoPath().projection(projection))
                .style("stroke", "black");

            // Tooltip formation
            let Tooltip_Map = d3
                .select("body", "#my_world_dataviz")
                .append("div")
                .attr("class", "tooltip_map");

            // Loading JSON
            let masterData;
            d3.json("data/json/ocean-microplastic-conc-data.json").then((data) => {
                console.log(data)
                masterData = data;

                // Forming Dropdown
                Object.entries(data).forEach(([ocean]) => {
                    const option = document.createElement("option");
                    option.value = ocean;
                    option.textContent = ocean;
                    oceanSelect.appendChild(option);
                });

                points = [];
                Object.entries(masterData).forEach(([ocean, regions]) => {
                    regions.forEach((region) => {
                        points.push({
                            name: region.name,
                            lat: region.lat,
                            long: region.long,
                            ocean: ocean,
                            color: oceanColors[ocean] || "#999",
                            fragments: region.fragments,
                            fibers: region.fibers,
                            films: region.films,
                            beads: region.beads,
                        });
                    });
                });

                worldMapSvg.append("defs").append("filter")
                    .attr("id", "glow")
                    .append("feGaussianBlur")
                    .attr("stdDeviation", 3)
                    .attr("result", "coloredBlur");

                const circles = worldMapSvg
                    .selectAll("circle")
                    .data(points)
                    .enter()
                    .append("circle")
                    .attr("cx", d => projection([d.long, d.lat])[0])
                    .attr("cy", d => projection([d.long, d.lat])[1])
                    .attr("r", 0)
                    .attr("fill", d => d.color)
                    .attr("stroke", d => d.color)
                    .attr("stroke-width", 4)
                    .attr("fill-opacity", 0.3)
                    .style("opacity", 0)
                    .style("filter", "url(#glow)")
                    .on("mouseover", function (event, d) {
                        Tooltip_Map
                            .style("opacity", 1)
                            .html(
                                `<strong>${d.name}</strong>`
                            );
                    })
                    .on("mousemove", function (event, d) {
                        Tooltip_Map
                            .style("font-size", "15px")
                            .style("color", "darkblue")
                            .style("left", event.pageX + 10 + "px")
                            .style("top", event.pageY - 28 + "px");
                    })
                    .on("mouseleave", function (event, d) {
                        Tooltip_Map.style("opacity", 0);
                    });

                circles.transition()
                    .delay((_, i) => i * 20)
                    .duration(800)
                    .ease(d3.easeCubicOut)
                    .attr("r", 6)
                    .style("opacity", 0.9)
                    .on("end", function () {
                        d3.select(this).style("filter", null);
                    });
            });



            d3.select("#popupChartClose").on("click", () => {
                d3.select("#popupChart").style("display", "none");
            });

            //lasso function
            const lassoLayer = worldMapSvg.append("g").attr("class", "lasso-layer");
            let lassoPath,
                lassoPoints = [],
                isLassoing = false;

            worldMapSvg.on("mousedown", (event) => {
                oceanSelect.value = "";
                isLassoing = true;
                lassoPoints = [d3.pointer(event)];
                if (lassoPath) lassoPath.remove();

                lassoPath = lassoLayer
                    .append("path")
                    .attr("fill", "rgba(0, 128, 255, 0.1)")
                    .attr("stroke", "#007bff")
                    .attr("stroke-width", 1.5);
            });

            worldMapSvg.on("mousemove", (event) => {
                if (!isLassoing) return;
                lassoPoints.push(d3.pointer(event));
                lassoPath.attr(
                    "d",
                    "M" + lassoPoints.map((d) => d.join(",")).join("L") + "Z"
                );
            });

            worldMapSvg.on("mouseup", () => {
                isLassoing = false;
                if (!lassoPath) return;

                const polygon = new Path2D(lassoPath.attr("d"));
                const context = document.createElement("canvas").getContext("2d");
                selectedData = [];

                worldMapSvg.selectAll("circle").each(function (d) {
                    const [x, y] = [
                        d3.select(this).attr("cx"),
                        d3.select(this).attr("cy"),
                    ];
                    const isInside = context.isPointInPath(polygon, +x, +y);
                    d3.select(this)
                        .attr("fill", isInside ? "red" : d.color)
                        .attr("stroke", isInside ? "red" : d.color);

                    if (isInside) selectedData.push(d);

                    const popup = d3.select("#popupChart");
                    popup
                        .style("display", "block")
                        .style("right", "120px")
                        .style("top", "85px");

                    // Update the bar chart

                    const DonutSvg = d3.select("#DonutPopup svg");
                    d3.select("#DonutPopup").style("display", "none");
                    DonutSvg.selectAll("*").remove();

                    const chartSvg = popup.select("svg");
                    chartSvg.selectAll("*").remove();

                    renderStackedBarChart(selectedData, chartSvg);
                    if (lassoPath) lassoPath.remove();
                    worldMapSvg.selectAll(".selection-ring").remove();
                    selectedData.forEach((d) => {
                        const cx = projection([d.long, d.lat])[0];
                        const cy = projection([d.long, d.lat])[1];

                        const ring = worldMapSvg
                            .append("circle")
                            .attr("class", "selection-ring")
                            .attr("cx", cx)
                            .attr("cy", cy)
                            .attr("r", 8)
                            .attr("stroke", "red")
                            .attr("stroke-width", 5)
                            .attr("fill", "none")
                            .style("opacity", 0.7);

                        function pulse() {
                            ring
                                .transition()
                                .duration(800)
                                .attr("r", 12)
                                .style("opacity", 0.3)
                                .transition()
                                .duration(800)
                                .attr("r", 8)
                                .style("opacity", 0.8)
                                .on("end", pulse);
                        }

                        pulse();
                    });
                });
            });

            //For Dropdown
            oceanSelect.addEventListener("change", function () {
                
                selectedOcean = this.value;
                if (!selectedOcean) return;
                const oceanData = points.filter((m) => m.ocean === selectedOcean);
                 
                const popup = d3.select("#popupChart");
                popup
                    .style("display", "block")
                    .style("right", "120px")
                    .style("top", "85px");

                // Update the bar chart
                console.log(popup, "&&&&&");
                const DonutSvg = d3.select("#DonutPopup svg");
                d3.select("#DonutPopup").style("display", "none");
                DonutSvg.selectAll("*").remove();

                const chartSvg = popup.select("svg");
                chartSvg.selectAll("*").remove();
                // const oceanData = points.filter((m) => m.ocean === selectedOcean);

                renderStackedBarChart(oceanData, chartSvg);
                if (lassoPath) lassoPath.remove();
                worldMapSvg.selectAll(".selection-ring").remove();
                oceanData.forEach((d) => {
                    const cx = projection([d.long, d.lat])[0];
                    const cy = projection([d.long, d.lat])[1];

                    const ring = worldMapSvg
                        .append("circle")
                        .attr("class", "selection-ring")
                        .attr("cx", cx)
                        .attr("cy", cy)
                        .attr("r", 8)
                        .attr("stroke", "red")
                        .attr("stroke-width", 5)
                        .attr("fill", "none")
                        .style("opacity", 0.7);

                    function pulse() {
                        ring
                            .transition()
                            .duration(800)
                            .attr("r", 12)
                            .style("opacity", 0.3)
                            .transition()
                            .duration(800)
                            .attr("r", 8)
                            .style("opacity", 0.8)
                            .on("end", pulse);
                    }

                    pulse();
              
                });
            });

            // Stacked Bar Chart function
            function renderStackedBarChart(dataOcean, chartSvg) {
                console.log(dataOcean);
                console.log(lassoPoints);
                const keys = ["fragments", "fibers", "films", "beads"];
                const colors = d3
                    .scaleOrdinal()
                    .domain(keys)
                    .range(["#457b9d", "#1d3557", "#a8dadc", "#e63946"]);

                const width = +chartSvg.attr("width");
                const height = +chartSvg.attr("height");
                const margin = { top: 30, right: 20, bottom: 100, left: 50 };

                const chart = chartSvg
                    .append("g")
                    .attr("transform", `translate(60,30)`);

                const x = d3
                    .scaleBand()
                    .domain(dataOcean.map((d) => d.name))
                    .range([0, width - margin.left - margin.right])
                    .padding(0.2);

                const y = d3
                    .scaleLinear()
                    .domain([
                        0,
                        d3.max(dataOcean, (d) =>
                            keys.reduce((sum, k) => sum + d[k], 0)
                        ),
                    ])
                    .nice()
                    .range([height - margin.top - margin.bottom, 0]);

                chart
                    .append("g")
                    .attr(
                        "transform",
                        `translate(0, ${height - margin.top - margin.bottom})`
                    )
                    .call(d3.axisBottom(x))
                    .style("font-size", "8px")
                    .style("color", "black")
                    .selectAll("text")
                    .attr("transform", "rotate(-40)")
                    .style("text-anchor", "end");

                chart
                    .append("g")
                    .call(d3.axisLeft(y))
                    .style("font-size", "8px")
                    .style("color", "black");

                const stackedData = d3.stack().keys(keys)(dataOcean);

                chart
                    .selectAll("g.layer")
                    .data(stackedData)
                    .join("g")
                    .attr("class", "layer")
                    .attr("fill", (d) => colors(d.key))
                    .selectAll("rect")
                    .data((d) => d)
                    .join("rect")
                    .attr("x", (d) => x(d.data.name))
                    .attr("y", y(0))
                    .attr("width", x.bandwidth())
                    .attr("height", 0)

                    .on("mouseover", function (event, d) {
                        const type = d3.select(this.parentNode).datum().key;
                        Tooltip_Map.transition().style("opacity", 1);
                        Tooltip_Map.style("font-size", "13px")
                            .style("color", "black")
                            .html(
                                `<strong>${d.data.name}</strong><br>${type}: ${d.data[type]}`
                            )
                            .style("left", `${event.pageX - 40}px`)
                            .style("top", `${event.pageY - 90}px`);
                    })
                    .on("mouseleave", () => Tooltip_Map.transition().style("opacity", 0))
                    .on("click", function (event, d) {
                        const [xPos, yPos] = d3.pointer(event, worldMapSvg.node());
                        const region = d.data;
                        showDonutChart(region);
                    })
                    .transition()
                    .delay((d, i) => i * 90)
                    .duration(200)
                    .ease(d3.easeSinInOut)
                    .attr("y", (d) => y(d[1]))
                    .attr("height", (d) => y(d[0]) - y(d[1]))
                    .style("opacity", 1);

                chart
                    .append("text")
                    .attr("text-anchor", "middle")
                    .attr("x", (width - margin.left - margin.right) / 2)
                    .attr("y", height - margin.top - 20)
                    .text("Subregions")
                    .style("font-size", "12px")
                    .style("font-weight", "bold")
                    .style("fill", "#333");

                chart
                    .append("text")
                    .attr("text-anchor", "middle")
                    .attr("transform", `rotate(-90)`)
                    .attr("x", -((height - margin.top - margin.bottom + 50) / 2))
                    .attr("y", -margin.left + 5)
                    .text("Microplastic Concentration (pieces/m³)")
                    .style("font-weight", "bold")
                    .style("font-size", "11px")
                    .style("fill", "#333");

                // legend
                const legend = chartSvg
                    .append("g")
                    .attr("transform", `translate(120, 10)`);

                keys.forEach((key, i) => {
                    const g = legend
                        .append("g")
                        .style("margin-left", "40px")
                        .attr("transform", `translate(${i * 90}, 0)`);

                    g.append("rect")
                        .attr("width", 14)
                        .attr("height", 14)
                        .attr("fill", colors(key));

                    g.append("text")
                        .attr("x", 20)
                        .attr("y", 10)
                        .text(key.charAt(0).toUpperCase() + key.slice(1))
                        .style("font-size", "13px")
                        .attr("alignment-baseline", "middle");
                });
            }

            d3.select("#DonutClose").on("click", () => {
                d3.select("#DonutPopup").style("display", "none");
            });

            function showDonutChart(region) {
                const popup = d3.select("#DonutPopup");
                popup
                    .style("display", "block")
                    .style("left", "100px")
                    .style("top", "80px")
                    .style("opacity", 0)
                    .style("transform", "scale(0.2)");

                const DonutSvg = popup.select("#DonutPopup svg");
                DonutSvg.selectAll("*").remove();

                setTimeout(() => {
                    popup.style("opacity", 1).style("transform", "scale(1)");
                }, 10);

                const width = 200,
                    height = 140,
                    radius = Math.min(width, height) / 2;
                const DonutGroup = DonutSvg.append("g").attr(
                    "transform",
                    `translate(${width / 2}, ${height / 2})`
                );

                const data = {
                    Fragments: region.fragments,
                    Fibers: region.fibers,
                    Films: region.films,
                    Beads: region.beads,
                };

                const color = d3
                    .scaleOrdinal()
                    .domain(Object.keys(data))
                    .range(["#457b9d", "#1d3557", "#a8dadc", "#e63946"]);

                const Donut = d3.pie().value((d) => d[1]);
                const arc = d3
                    .arc()
                    .innerRadius(radius * 0.5)
                    .outerRadius(radius);

                DonutGroup.selectAll("path")
                    .data(Donut(Object.entries(data)))
                    .join("path")
                    .attr("fill", (d) => color(d.data[0]))
                    .transition()
                    .duration(1000)
                    .attrTween("d", function (d) {
                        const i = d3.interpolate(
                            { startAngle: d.startAngle, endAngle: d.startAngle },
                            d
                        );
                        return function (t) {
                            return arc(i(t));
                        };
                    });

                const labelGroups = DonutGroup.selectAll("g.label")
                    .data(Donut(Object.entries(data)))
                    .join("g")
                    .attr("class", "label")
                    .attr("transform", (d) => `translate(${arc.centroid(d)})`)
                    .style("opacity", 0);

                labelGroups
                    .append("text")
                    .text((d) => `${d.data[0]}: ${d.data[1]}`)
                    .attr("text-anchor", "middle")
                    .attr("alignment-baseline", "middle")
                    .attr("fill", "#333")
                    .style("font-size", "11px")
                    .style("font-weight", "bold")
                    .each(function (d, i) {
                        const bbox = this.getBBox();
                        d3.select(this.parentNode)
                            .insert("rect", "text")
                            .attr("x", bbox.x - 4)
                            .attr("y", bbox.y - 2)
                            .attr("width", bbox.width + 8)
                            .attr("height", bbox.height + 4)
                            .attr("rx", 4)
                            .attr("fill", "white")
                            .attr("stroke", "#ccc")
                            .attr("stroke-width", 0.5);
                    });

                labelGroups.transition().duration(1000).style("opacity", 1);
            }
        });