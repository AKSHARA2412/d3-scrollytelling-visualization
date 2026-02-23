const oceanMpSvg = d3.select("#ocean-mp"),
                oceanMpWidth = +oceanMpSvg.attr("width"),
                oceanMpHeight = +oceanMpSvg.attr("height");

            const oceanMpProjection = d3.geoNaturalEarth1()
                .scale(oceanMpWidth / 1.85 / Math.PI)
                .translate([oceanMpWidth / 2, oceanMpHeight / 2])

            const oceanMpPath = d3.geoPath().projection(oceanMpProjection);

            d3.json("data/json/ocean-microplastic-conc-data.json").then(data => {
                const oceanColors = {
                    "Atlantic Ocean": "#1f77b4",
                    "Pacific Ocean": "#ff7f0e",
                    "Indian Ocean": "#2ca02c",
                    "Arctic Ocean": "#d62728",
                    "Southern Ocean": "#9467bd"
                };

                const markers = [];

                Object.entries(data).forEach(([ocean, regions]) => {
                    regions.forEach(region => {
                        markers.push({
                            name: region.name,
                            lat: region.lat,
                            long: region.long,
                            ocean: ocean,
                            color: oceanColors[ocean] || "#999"
                        });
                    });
                });

                function getDistance(a, b) {
                    const R = 6371;
                    const toRad = deg => deg * Math.PI / 180;
                    const dLat = toRad(b.lat - a.lat);
                    const dLon = toRad(b.long - a.long);
                    const lat1 = toRad(a.lat);
                    const lat2 = toRad(b.lat);
                    const aVal = Math.sin(dLat / 2) ** 2 +
                        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
                    const c = 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));
                    return R * c;
                }

                function generateNearestCurrentsWithReverse(markers) {
                    const currents = [];
                    markers.forEach((from, i) => {
                        const distances = markers
                            .map((to, j) => i !== j ? {
                                from: { long: from.long, lat: from.lat, name: from.name },
                                to: { long: to.long, lat: to.lat, name: to.name },
                                distance: getDistance(from, to)
                            } : null)
                            .filter(d => d !== null)
                            .sort((a, b) => a.distance - b.distance);

                        distances.slice(0, 5).forEach(d => {
                            currents.push({ from: d.from, to: d.to });
                            //currents.push({ from: d.to, to: d.from });
                        });
                    });
                    return currents;
                }

                const currents = generateNearestCurrentsWithReverse(markers);

                d3.json("data/json/world.json").then(world => {
                    oceanMpSvg.append("rect")
                        .attr("width", oceanMpWidth)
                        .attr("height", oceanMpHeight)
                        // .attr("fill", "rgb(33, 104, 107)");

                    const tooltip = d3.select("#tooltip");
                    const currentGroup = oceanMpSvg.append("g").attr("class", "currents");

                    currents.forEach((flow, i) => {
                        const pathData = curvedPath(flow.from, flow.to);

                        const path = currentGroup.append("path")
                            .attr("d", pathData)
                            .attr("stroke", i % 2 === 0 ? "#0077be" : "#2a9d8f")
                            .attr("stroke-width", 1.5)
                            .attr("stroke-dasharray", "4 4")
                            // .attr("marker-end", "url(#arrowhead)")
                            .attr("fill", "none")
                            .attr("opacity", 0.4)
                            .on("mouseover", event => {
                                tooltip.style("opacity", 1)
                                    .html(`<strong>${flow.from.name}</strong> -> <strong>${flow.to.name}</strong>`)
                                    .style("left", (event.pageX + 12) + "px")
                                    .style("top", (event.pageY - 28) + "px");
                            })
                            .on("mousemove", event => {
                                tooltip.style("left", (event.pageX + 12) + "px")
                                    .style("top", (event.pageY - 28) + "px");
                            })
                            .on("mouseleave", () => tooltip.style("opacity", 0));

                        const dot = currentGroup.append("circle")
                            .attr("r", 2)
                            .attr("fill", i % 2 === 0 ? "#1f78b4" : "#34a0a4");

                        function animate() {
                            dot.transition()
                                .duration(4000 + (i % 5) * 300)
                                .ease(d3.easeLinear)
                                .attrTween("transform", function () {
                                    const length = path.node().getTotalLength();
                                    return function (t) {
                                        const pos = path.node().getPointAtLength(t * length);
                                        return `translate(${pos.x},${pos.y})`;
                                    };
                                })
                                .on("end", animate);
                        }

                        animate();
                    });

                    oceanMpSvg.append("g")
                        .selectAll("path")
                        .data(world.features)
                        .enter()
                        .append("path")
                        .attr("fill", "#b8d8e2")
                        .attr("d", oceanMpPath)
                        .attr("stroke", "#333")
                        .attr("stroke-width", 0.3);

                    const Tooltip = d3.select("#my_world_dataviz")
                        .append("div")
                        .attr("class", "tooltip_Name");

                    oceanMpSvg.append("g")
                        .selectAll("circle")
                        .data(markers)
                        .enter()
                        .append("circle")
                        .attr("cx", d => oceanMpProjection([d.long, d.lat])[0])
                        .attr("cy", d => oceanMpProjection([d.long, d.lat])[1])
                        .attr("r", 4)
                        .attr("fill", d => d.color)
                        .attr("stroke", d => d.color)
                        .attr("stroke-width", 2)
                        .attr("fill-opacity", 1)
                        .on("mouseover", function (event, d) {
                            Tooltip.style("opacity", 1)
                                .html(`<strong>${d.name}</strong><br>Longitude: ${d.long}<br>Latitude: ${d.lat}`)
                                .style("left", (event.pageX + 10) + "px")
                                .style("top", (event.pageY - 28) + "px");
                        })
                        .on("mousemove", function (event) {
                            Tooltip.style("left", (event.pageX + 10) + "px")
                                .style("top", (event.pageY - 28) + "px");
                        })
                        .on("mouseleave", function () {
                            Tooltip.style("opacity", 0);
                        });

                    function curvedPath(start, end) {
                        const x0 = oceanMpProjection([start.long, start.lat])[0];
                        const y0 = oceanMpProjection([start.long, start.lat])[1];
                        const x1 = oceanMpProjection([end.long, end.lat])[0];
                        const y1 = oceanMpProjection([end.long, end.lat])[1];
                        const dx = x1 - x0;
                        const dy = y1 - y0;
                        const curvature = 0.5;
                        const cx = x0 + dx / 2 - dy * curvature;
                        const cy = y0 + dy / 2 + dx * curvature;
                        return `M${x0},${y0} Q${cx},${cy} ${x1},${y1}`;
                    }
                });
            });