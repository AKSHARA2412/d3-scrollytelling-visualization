const waterFlowMargin = { top: 60, right: 30, bottom: 50, left: 60 },
                waterFlowWidth = 800 - waterFlowMargin.left - waterFlowMargin.right,
                waterFlowHeight = 350 - waterFlowMargin.top - waterFlowMargin.bottom;

            const waterFlowSvg = d3.select("#chart_control")
                .append("svg")
                .attr("width", waterFlowWidth + waterFlowMargin.left + waterFlowMargin.right)
                .attr("height", waterFlowHeight + waterFlowMargin.top + waterFlowMargin.bottom);

            const chart = waterFlowSvg.append("g")
                .attr("transform", `translate(${waterFlowMargin.left},${waterFlowMargin.top})`);

            const axes = waterFlowSvg.append("g")
                .attr("class", "axes")
                .attr("transform", `translate(${waterFlowMargin.left},${waterFlowMargin.top})`);

            const waterFlowTooltip = d3.select("#tooltip_control_aks");
            const metrics = [
                "Concentration total/m3",
                "Concentration fragments/m3",
                "Concentration fibers/lines/m3",
                "Concentration foams/m3"
            ];

            const colors = {
                "runoff-event": "#EF553B",
                "low-flow": "#636EFA"
            };

            let currentMetric = metrics[0];
            let currentStation = "All Stations";
            let currentCondition = "all";
            let data;
            let animationInterval;

            d3.csv("data/csv/microplastic.csv").then(dataset => {
                dataset.forEach(d => {
                    metrics.forEach(m => {
                        d[m] = isNaN(+d[m]) ? 0 : +d[m];
                    });
                });
                data = dataset;
                setupControls();
                render();
            });

            function setupControls() {
                const metricButtons = d3.select("#chart-container")
                    .append("div")
                    .attr("class", "metric-buttons");

                metricButtons.selectAll("button")
                    .data(metrics)
                    .enter()
                    .append("button")
                    .text(d => d.replace("Concentration ", "").replace("/m3", ""))
                    .attr("class", d => d === currentMetric ? "active" : null)
                    .on("click", function (event, m) {
                        currentMetric = m;
                        d3.selectAll(".metric-buttons button").classed("active", false);
                        d3.select(this).classed("active", true);
                        render();
                    });

                d3.select("#filter")
                    .on("change", function () {
                        currentCondition = this.value;
                        render();
                    });

                const stations = ["All Stations", ...new Set(data.map(d => d["Station name"]))];
                const stationFilter = d3.select("#controls")
                    .append("select")
                    .attr("id", "station-filter")
                    .on("change", function () {
                        currentStation = this.value;
                        render();
                    });

                stationFilter.selectAll("option")
                    .data(stations)
                    .enter()
                    .append("option")
                    .text(d => d);

                d3.select("#controls")
                    .append("button")
                    .text("Reset View")
                    .on("click", () => {
                        if (
                            currentMetric === metrics[0] &&
                            currentStation === "All Stations" &&
                            currentCondition === "all"
                        ) return;
                        currentMetric = metrics[0];
                        currentStation = "All Stations";
                        currentCondition = "all";

                        d3.selectAll(".metric-buttons button").classed("active", false);
                        d3.select(".metric-buttons button:first-child").classed("active", true);
                        d3.select("#station-filter").property("value", "All Stations");
                        d3.select("#filter").property("value", "all");
                        render();
                    });

                d3.select("#controls")
                    .append("button")
                    .text("Play")
                    .on("click", function () {
                        const btn = d3.select(this);
                        if (btn.text() === "Play") {
                            btn.text("Pause");
                            let metricIndex = 0;
                            let stationIndex = 0;
                            const stations = ["All Stations", ...new Set(data.map(d => d["Station name"]))];

                            updateAnimation();

                            animationInterval = setInterval(updateAnimation, 2000);

                            function updateAnimation() {
                                currentMetric = metrics[metricIndex % metrics.length];
                                if (metricIndex % metrics.length === 0) {
                                    currentStation = stations[stationIndex % stations.length];
                                    stationIndex++;
                                    d3.select("#station-filter").property("value", currentStation);
                                }
                                d3.selectAll(".metric-buttons button").classed("active", false);
                                d3.selectAll(".metric-buttons button")
                                    .filter(d => d === currentMetric)
                                    .classed("active", true);
                                render();
                                metricIndex++;
                            }
                        } else {
                            btn.text("Play");
                            clearInterval(animationInterval);
                        }
                    });
            }

            function render() {
                chart.selectAll("*").remove();
                axes.selectAll("*").remove();

                let filtered = data;
                if (currentStation !== "All Stations") {
                    filtered = filtered.filter(d => d["Station name"] === currentStation);
                }
                if (currentCondition !== "all") {
                    filtered = filtered.filter(d => d["Hydrologic condition"] === currentCondition);
                }
                filtered = filtered.filter(d => !isNaN(d[currentMetric]));

                const conditions = Array.from(new Set(filtered.map(d => d["Hydrologic condition"])));
                const x = d3.scaleBand()
                    .domain(conditions)
                    .range([0, waterFlowWidth])
                    .padding(0.4);

                const validValues = filtered.map(d => d[currentMetric]).filter(v => v > 0);
                const yMax = validValues.length > 0 ? d3.max(validValues) : 1;
                const y = d3.scaleLinear()
                    .domain([0, yMax * 1.2])
                    .nice()
                    .range([waterFlowHeight, 0]);

                axes.append("g")
                    .attr("class", "x-axis")
                    .attr("transform", `translate(0,${waterFlowHeight})`)
                    .call(d3.axisBottom(x));

                axes.append("g")
                    .attr("class", "y-axis")
                    .call(d3.axisLeft(y));

                axes.append("text")
                    .attr("transform", "rotate(-90)")
                    .attr("x", -waterFlowHeight / 2)
                    .attr("y", -45)
                    .attr("text-anchor", "middle")
                    .style("font-size", "14px")
                    .style('fill', '#fff')
                    .text(`${currentMetric.replace("Concentration ", "")} (particles/m³)`);

                axes.append("text")
                    .attr("x", waterFlowWidth / 2)
                    .attr("y", waterFlowHeight + 40)
                    .attr("text-anchor", "middle")
                    .style("font-size", "14px")
                    .text("Hydrologic Condition")
                    .style('fill', '#fff');

                if (filtered.length > 0) {
                    const grouped = d3.groups(filtered, d => d["Hydrologic condition"]);

                    grouped.forEach(([condition, values]) => {
                        const boxX = x(condition) + x.bandwidth() / 2;
                        const sorted = values.map(d => d[currentMetric]).sort(d3.ascending);
                        const q1 = d3.quantile(sorted, 0.25);
                        const median = d3.quantile(sorted, 0.5);
                        const q3 = d3.quantile(sorted, 0.75);
                        const min = d3.min(sorted);
                        const max = d3.max(sorted);

                        const boxGroup = chart.append("g")
                            .on("mouseover", (event) => {
                                humanBrainTooltip.transition().duration(100).style("opacity", 1);
                                humanBrainTooltip.html(`
              <b>${condition}</b><br/>
              Min: ${min.toFixed(2)}<br/>
              Q1: ${q1.toFixed(2)}<br/>
              Median: ${median.toFixed(2)}<br/>
              Q3: ${q3.toFixed(2)}<br/>
              Max: ${max.toFixed(2)}
            `)
                                    .style("left", `${event.pageX + 15}px`)
                                    .style("top", `${event.pageY - 28}px`);
                            })
                            .on("mouseout", () => {
                                humanBrainTooltip.transition().duration(200).style("opacity", 0);
                            });

                        boxGroup.append("line")
                            .attr("x1", boxX)
                            .attr("x2", boxX)
                            .attr("y1", y(min))
                            .attr("y2", y(max))
                            .attr("stroke", "black");

                        boxGroup.append("rect")
                            .attr("x", boxX - 15)
                            .attr("y", y(q3))
                            .attr("width", 30)
                            .attr("height", y(q1) - y(q3))
                            .attr("stroke", "black")
                            .attr("fill", colors[condition])
                            .attr("fill-opacity", 0.4);

                        boxGroup.append("line")
                            .attr("x1", boxX - 15)
                            .attr("x2", boxX + 15)
                            .attr("y1", y(median))
                            .attr("y2", y(median))
                            .attr("stroke", "black")
                            .attr("stroke-width", 2);

                        chart.selectAll(`.dot-${condition}`)
                            .data(values)
                            .enter()
                            .append("circle")
                            .attr("cx", d => boxX + (Math.random() - 0.5) * 25)
                            .attr("cy", d => y(d[currentMetric]))
                            .attr("r", 2.5)
                            .attr("fill", colors[condition])
                            .attr("stroke", "white")
                            .attr("stroke-width", 0.5)
                            .on("mouseover", function (event, d) {
                                d3.select(this)
                                    .transition().duration(100)
                                    .attr("r", 4).attr("stroke", "black").attr("stroke-width", 1.5);
                                humanBrainTooltip.transition().duration(100).style("opacity", 1);
                                humanBrainTooltip.html(`
              <b>${d["Hydrologic condition"]}</b><br/>
              ${currentMetric.split(" ")[1]}: ${d[currentMetric]} particles/m³<br/>
              Station: ${d["Station name"]}<br/>
              Sampling: ${d["Sampling method"]}<br/>
              Fragments: ${d["Concentration fragments/m3"]}<br/>
              Fibers: ${d["Concentration fibers/lines/m3"]}<br/>
              Foams: ${d["Concentration foams/m3"]}
            `)
                                    .style("left", `${event.pageX + 15}px`)
                                    .style("top", `${event.pageY - 28}px`);
                            })
                            .on("mouseout", function () {
                                d3.select(this).transition().duration(100).attr("r", 2.5).attr("stroke", "white").attr("stroke-width", 0.5);
                                humanBrainTooltip.transition().duration(200).style("opacity", 0);
                            });
                    });
                }
            }
       