const plasticBrandsSvg = d3.select("#injest-microplastics");

plasticBrandsSvg
    .attr("height", 600)
    .style("background-color", "none");

plasticBrandsSvg.append("circle")
    .attr("cx", 154.2)
    .attr("cy", 320.2)
    .attr("r", 79.8)
    .attr("fill", "yellow")
    .attr("stroke", "white")
    .attr("stroke-width", 2)
    .attr("stroke-linecap", "round")
    .attr("stroke-linejoin", "round");

plasticBrandsSvg.append("path")
    .attr("d", "M154.2,320.2 L224.2,280.2 A80,80 0 0,1 225.2,360.2 Z")
    .attr("fill", "black")
    .attr("stroke", "none")
    .attr("stroke-width", 1);

const movingCircles = [];

d3.csv("data/csv/plastic-producers-brands.csv").then((dataset) => {
    dataset.forEach((d, i) => {
        const numCircles = Math.max(
            1,
            Math.floor(d.Plastic_Packaging_Weight_tonnes / 15000)
        );

        for (let i = 0; i < numCircles; i++) {
            const circle = plasticBrandsSvg
                .append("circle")
                .attr("cx", window.innerWidth + i * 20)
                .attr("cy", Math.random() * 600)
                .attr("r", 6)
                .attr("fill", d.color_code)
                .attr("opacity", 0.7);
            movingCircles.push(circle);
        }

        const itemsPerRow = Math.ceil(dataset.length / 4);

        const row = Math.floor(i / itemsPerRow);
        const col = i % itemsPerRow;

        plasticBrandsSvg
            .append("text")
            .attr("x", col * 280 + 40)
            .attr("y", 500 + row * 20)
            .attr("text-anchor", "start")
            .attr("font-size", "12px")
            .attr("fill", "white")
            .text(d["Brand"]);

        if (i === dataset.length - 1) {
            plasticBrandsSvg
                .append("rect")
                .attr("x", 20)
                .attr("y", 120)
                .attr("width", 100)
                .attr("height", 30)
                .attr("rx", 5)
                .attr("fill", "#2a9d8f")
                .attr("cursor", "pointer")
                .on("click", () => {
                    movingCircles.forEach(circle => {
                        circle
                            .attr("cx", window.innerWidth + i * 20)
                            .attr("cy", Math.random() * 600)
                    });
                    animateCircles();
                });

            plasticBrandsSvg
                .append("text")
                .attr("x", 70)
                .attr("y", 140)
                .attr("text-anchor", "middle")
                .attr("fill", "white")
                .attr("pointer-events", "none")
                .style("font-size", "14px")
                .text("Replay");
        }
    });

    animateCircles();
});

function animateCircles() {
    movingCircles.forEach((circle) => {
        const duration = Math.random() * 10000 + 3000;
        circle
            .transition()
            .duration(duration)
            .attr("cx", -50)
            .attr("cy", Math.random() * 50 + 300)
            .ease(d3.easeLinear)
    });

    setTimeout(() => {
        plasticBrandsSvg
            .append("text")
            .attr("x", window.innerWidth / 2)
            .attr("y", 300)
            .attr("text-anchor", "middle")
            .attr("fill", "white")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .style("opacity", 0)
            .each(function () {
                d3.select(this)
                    .append("tspan")
                    .attr("x", window.innerWidth / 2)
                    .attr("dy", 0)
                    .text("56 companies are responsible for over 50% of our tasty plastic treats, apparently");

                d3.select(this)
                    .append("tspan")
                    .attr("x", window.innerWidth / 2)
                    .attr("dy", "1.2em")
                    .text("While we couldn't fit all of them here, here are some of the top contributors");
            })
            .transition()
            .duration(1000)
            .style("opacity", 1)
            .ease(d3.easeQuadOut);
    }, 10000);
}