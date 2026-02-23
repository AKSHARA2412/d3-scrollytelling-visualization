// Set global dimensions and margins.
const margin = { top: 20, right: 20, bottom: 30, left: 50 };
const width  = 700 - margin.left - margin.right;
const height = 300 - margin.top  - margin.bottom;

document.addEventListener('DOMContentLoaded', function () {
	// Create svg.
	const svg = d3.select("#flow-water")
	.append("svg")
		.attr("width",  width + margin.left + margin.right * 5)
		.attr("height", height + margin.top  + margin.bottom)
	.append("g")
		.attr("transform", `translate(${margin.left},${margin.top}) rotate(0)`);

	const background = svg.append("g").lower();

  	// Load and process the CSV dataset
  	d3.csv("data/csv/plastic-waste-accumulated-wide.csv").then(function(data) {
		data.forEach(d => {
			d.Year = +d.Year;
			for (const k in d) if (k !== "Year") d[k] = +d[k];
		});

		const keys   = data.columns.filter(c => c !== "Year");
		const stack  = d3.stack().offset(d3.stackOffsetSilhouette).keys(keys);
		const series = stack(data);

		// Create a tooltip
		const Tooltip = d3.select("body")
			.append("div")
			.style("opacity", 0)
			.style("position", "absolute")
			.style("background-color", "white")
			.style("border", "1px solid #ccc")
			.style("padding", "6px")
			.style("border-radius", "4px")
			.style("pointer-events", "none")
			.style("font-size", "14px")
			.style("color", "#333");

		const mouseover = function(event, d) {
			Tooltip.style("opacity", 1);
			d3.selectAll(".layer").style("opacity", 0.2);
			d3.select(this)
			.style("stroke", "black")
			.style("opacity", 1);
		};
      
		const mousemove = function(event, d) {
			const [x] = d3.pointer(event);
			const year = Math.round(xScale.invert(x));
		
			const datum = d.find(p => p.data.Year === year);
			if (!datum) return;
		
			const concentration = datum[1] - datum[0];
			const category = d.key;
		
			Tooltip
			.html(`<strong>${category}</strong><br/>Year: ${year}<br/>Concentration: ${concentration.toFixed(2)} tonnes`)
			.style("left", (event.pageX + 15) + "px")
			.style("top", (event.pageY - 28) + "px");
		};
      
		const mouseleave = function(event, d) {
			Tooltip.style("opacity", 0);
			d3.selectAll(".layer").style("opacity", 1).style("stroke", "none");
		};      

		// X axes scale
		const xScale = d3.scaleLinear()
			.domain(d3.extent(data, d => d.Year))
			.range([0, width]);

		svg.append("g")
			.attr("transform", `translate(0,${height})`)
			.call(d3.axisBottom(xScale));

		// Y axes from set min to max
		const yMin = d3.min(series, s => d3.min(s, d => d[0]));
		const yMax = d3.max(series, s => d3.max(s, d => d[1]));
		const yScale = d3.scaleLinear()
			.domain([yMin, yMax])
			.range([0, height]);

		// Stream graph
		const area = d3.area()
			.curve(d3.curveBumpX)
			.x(d => xScale(d.data.Year))
			.y0(d => yScale(d[0]))
			.y1(d => yScale(d[1]));

		// Color scale
		const color = d3.scaleSequential()
		.domain([0, keys.length - 1])
		.interpolator(d3.interpolateBlues);

		// Stream layers
		svg.selectAll("path.layer")
		.data(series)
		.enter().append("path")
			.attr("class", "layer")
			.attr("d", area)
			.attr("fill",   (d,i) => color(i))
			.attr("d", area)
			.on("mouseover", mouseover)
			.on("mousemove", mousemove)
			.on("mouseleave", mouseleave);

		// Layers.
		const layers = svg.selectAll("path.layer");

        layers.each(function(layerData, i) {
            const midLine = d3.line()
              .curve(d3.curveBumpX)
              .x(d => xScale(d.data.Year))
              .y(d => yScale((d[0] + d[1]) / 2));
          
            const midPath = svg.append("path")
              .datum(layerData)
              .attr("d", midLine)
              .attr("fill", "none")
              .attr("stroke", "none");
          
            const pathEl = midPath.node();
            const pathLen = pathEl.getTotalLength();

            d3.interval(() => {
              const size = 1 + Math.random() * 3;
              const particle = svg.append("rect")
                .attr("width", size)
                .attr("height", size)
                .attr("fill", "#999")
                .attr("opacity", 0.6);
          
              particle.transition()
                .duration(2000 + Math.random() * 2000)
                .attrTween("transform", () => t => {
                  const p = pathEl.getPointAtLength(t * pathLen);
                  const angle = (t * 360) * (Math.random() < 0.5 ? 1 : -1);
                  return `translate(${p.x},${p.y}) rotate(${angle})`;
                })
                .transition()
                  .duration(500)
                  .attr("opacity", 0)
                  .remove();
            }, 100 + Math.random() * 200);
		});


	const urbanGroup = svg.append("g").attr("transform", `translate(10, ${height / 2 - 130}) scale(0.9)`);

	// Buildings
	urbanGroup.append("rect")
		.attr("x", 0).attr("y", 0)
		.attr("width", 40).attr("height", 60)
		.attr("fill", "#90A4AE");

	urbanGroup.append("rect")
		.attr("x", 35).attr("y", 10)
		.attr("width", 25).attr("height", 50)
		.attr("fill", "#B0BEC5");

	urbanGroup.append("rect")
		.attr("x", 65).attr("y", 20)
		.attr("width", 20).attr("height", 40)
		.attr("fill", "#CFD8DC");

	for (let x = 5; x < 25; x += 6) {
		for (let y = 5; y < 55; y += 10) {
		urbanGroup.append("rect")
			.attr("x", x).attr("y", y)
			.attr("width", 3).attr("height", 5)
			.attr("fill", "#ECEFF1");
		}
	}

	// Cars
	urbanGroup.append("rect")
		.attr("x", 20).attr("y", 70)
		.attr("width", 20).attr("height", 10)
		.attr("fill", "#546E7A");
	urbanGroup.append("circle")
		.attr("cx", 23).attr("cy", 80).attr("r", 3).attr("fill", "#263238");
	urbanGroup.append("circle")
		.attr("cx", 37).attr("cy", 80).attr("r", 3).attr("fill", "#263238");

	const factoryGroup = svg.append("g").attr("transform", `translate(${250}, ${height - 50}) scale(0.8)`);

	// Factory
	factoryGroup.append("rect")
		.attr("x", 0).attr("y", 30)
		.attr("width", 60).attr("height", 30)
		.attr("fill", "#BDBDBD");

	// Chimneys
	factoryGroup.append("rect")
		.attr("x", 10).attr("y", 0)
		.attr("width", 10).attr("height", 30)
		.attr("fill", "#78909C");

	factoryGroup.append("rect")
		.attr("x", 30).attr("y", 10)
		.attr("width", 10).attr("height", 20)
		.attr("fill", "#90A4AE");

	// Smoke
	function spawnSmoke(x, y) {
	const puff = factoryGroup.append("circle")
		.attr("cx", x)
		.attr("cy", y)
		.attr("r", 4 + Math.random() * 2)
		.attr("fill", "#ECEFF1")
		.attr("opacity", 0.8);

	puff.transition()
		.duration(2500)
		.attr("cy", y - 30)
		.attr("r", 10)
		.attr("opacity", 0)
		.remove();
	}

	d3.interval(() => {
		spawnSmoke(15, 0);
		spawnSmoke(35, 10);
	}, 1200);

    })
    .catch(error => console.error("Error loading or processing data:", error));
});