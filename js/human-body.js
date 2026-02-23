const humanBodySvg = d3.select("#overlay");
const barSvg = d3.select("#barChart");
const label = d3.select("#label");
const infoBox = d3.select("#infoBox");

const damageData = [
  {
    id: "brain",
    name: "Brain",
    damage: 40,
    info: "Microplastics may cross the blood-brain barrier, triggering inflammation, oxidative stress, and impairing cognitive functions over time.",
  },
  {
    id: "left_Lung",
    name: "Left Lung",
    damage: 30,
    info: "Inhaled microplastics embed in lung tissues, provoking chronic inflammation, reducing oxygen exchange, and increasing respiratory risks.",
  },
  {
    id: "right_Lung",
    name: "Right Lung",
    damage: 30,
    info: "Right lung tissues face similar microplastic exposure, leading to fibrosis, tissue scarring, and heightened susceptibility to infections.",
  },
  {
    id: "heart",
    name: "Heart",
    damage: 15,
    info: "Circulating microplastics can disrupt cardiovascular function, promoting arterial stiffness, impaired blood flow, and raising heart disease risk.",
  },
  {
    id: "liver",
    name: "Liver",
    damage: 25,
    info: "Accumulation of microplastics in the liver may hinder detoxification, increase fat deposits, and induce cellular stress responses.",
  },
  {
    id: "stomach",
    name: "Stomach",
    damage: 20,
    info: "Ingested microplastics can erode the stomach lining, provoke inflammation, and interfere with normal digestive acid balance.",
  },
  {
    id: "left_Kidney",
    name: "Left Kidney",
    damage: 22,
    info: "Microplastics may compromise the kidney’s filtration units, reducing toxin clearance and promoting tissue inflammation over time.",
  },
  {
    id: "right_Kidney",
    name: "Right Kidney",
    damage: 22,
    info: "Chronic microplastic exposure affects kidney function symmetrically, leading to potential filtration inefficiency and fluid imbalance.",
  },
  {
    id: "pancreas",
    name: "Pancreas",
    damage: 18,
    info: "Microplastics may disrupt pancreatic enzyme production and insulin regulation, increasing risks for metabolic disorders and diabetes.",
  },
  {
    id: "small_Intestine",
    name: "Small Intestine",
    damage: 28,
    info: "Microplastics interfere with gut microbiota balance, impair nutrient absorption, and weaken the intestinal barrier, leading to inflammation.",
  },
  {
    id: "large_Intestine",
    name: "Large Intestine",
    damage: 24,
    info: "Accumulated microplastics in the colon can provoke barrier dysfunction, slow waste transit, and heighten the risk of gastrointestinal disease.",
  },
  {
    id: "bladder",
    name: "Bladder",
    damage: 15,
    info: "Microplastic particles may irritate bladder tissues, disrupt urinary tract health, and contribute to infection susceptibility or irritation.",
  },
  {
    id: "left_Arm",
    name: "Left Arm",
    damage: 5,
    info: "Although direct impact is minimal, circulatory disruption from microplastics can indirectly reduce oxygen and nutrient delivery to limbs.",
  },
  {
    id: "right_Arm",
    name: "Right Arm",
    damage: 5,
    info: "Similar to the left arm, microplastics indirectly affect limb health by impairing blood circulation and increasing oxidative stress.",
  },
  {
    id: "left_Toe",
    name: "Left Toe",
    damage: 2,
    info: "Microplastic-related vascular damage may minimally affect peripheral tissues like toes, though systemic circulation plays a larger role.",
  },
  {
    id: "right_Toe",
    name: "Right Toe",
    damage: 2,
    info: "Circulatory microplastic impacts are rarely pronounced in extremities but can subtly influence peripheral tissue oxygenation and repair.",
  },
];


const organs = [
  // Main organs
  { id: "brain", cx: 400, cy: 26, rx: 25, ry: 25 },
  { id: "right Lung", cx: 427, cy: 126, rx: 18, ry: 30 },
  { id: "left Lung", cx: 385, cy: 126, rx: 18, ry: 30 },
  { id: "heart", cx: 403, cy: 145, rx: 15, ry: 15 },
  { id: "liver", cx: 393, cy: 174, rx: 30, ry: 15 },
  { id: "stomach", cx: 409, cy: 189, rx: 10, ry: 19 },
  { id: "left Kidney", cx: 389, cy: 209, rx: 9, ry: 15 },
  { id: "right Kidney", cx: 420, cy: 206, rx: 9, ry: 15 },
  // { id: "pancreas", cx: 300, cy: 245, rx: 30, ry: 10 },
  { id: "small Intestine", cx: 392, cy: 233, rx: 25, ry: 25 },
  { id: "large Intestine", cx: 419, cy: 244, rx: 15, ry: 15 },
  { id: "bladder", cx: 402, cy: 260, rx: 15, ry: 20 },

  // Added arms
  { id: "left Arm", cx: 335, cy: 206, rx: 20, ry: 20 },
  { id: "right Arm", cx: 463, cy: 206, rx: 20, ry: 20 },

  // Added toes
  { id: "left Toe", cx: 365, cy: 485, rx: 8, ry: 10 },
  { id: "right Toe", cx: 443, cy: 485, rx: 8, ry: 10 },
];

// document.addEventListener('click', function (event) {
//   const x = event.clientX;
//   const y = event.clientY;
//   console.log(`Clicked at: X = ${x}, Y = ${y}`);
// });

// Draw each invisible clickable region
organs.forEach((organ) => {
  humanBodySvg
    .append("ellipse")
    .attr("cx", organ.cx)
    .attr("cy", organ.cy)
    .attr("rx", organ.rx)
    .attr("ry", organ.ry)
    .attr("id", organ.id.replace(/\s+/g, "_")) // fixing IDs
    .attr("class", "organ-part")
    .on("mouseover", function (event) {
      showLabel(event, organ.id);
    })
    .on("mouseout", hideLabel)
    .on("click", () => {
      const [x, y] = d3.pointer(event);
      console.log(
        `Mouse Clicked at: X = ${Math.round(x)}, Y = ${Math.round(y)}`
      );
      return updateInfo(organ);
    }); // pass organ, not just id
});
humanBodySvg.on("click", function (event) {
  const [x, y] = d3.pointer(event);
  console.log(
    `Mouse Clicked at: X = ${Math.round(x)}, Y = ${Math.round(y)}`
  );
});

const organEmojis = {
  brain: "🧠",
  left_Lung: "🫁",
  right_Lung: "🫁",
  heart: "❤️",
  liver: "🧫",
  stomach: "🦠",
  left_Kidney: "🧬",
  right_Kidney: "🧬",
  pancreas: "🔬",
  small_Intestine: "🩻",
  large_Intestine: "🩺",
  bladder: "🚽",
  left_Arm: "💪",
  right_Arm: "💪",
  left_Toe: "🦶",
  right_Toe: "🦶",
};

// X and Y Scales
const x = d3
  .scaleBand()
  .domain(damageData.map((d) => d.name))
  .range([50, 550])
  .padding(0.2);

const y = d3.scaleLinear().domain([0, 50]).range([250, 50]);

const bars = barSvg
  .selectAll(".bar")
  .data(damageData)
  .enter()
  .append("rect")
  .attr("id", (d) => `bar-${d.id}`)
  .attr("class", "bar")
  .attr("x", (d) => x(d.name))
  .attr("y", 250) // Start at bottom
  .attr("width", x.bandwidth())
  .attr("height", 0) // Start at height 0
  .style("opacity", 0) // Start invisible
  .attr("fill", "url(#gradBar)") // Gradient fill if you want
  .transition()
  .duration(1000)
  .delay((d, i) => i * 100) // Staggered delay per bar
  .attr("y", (d) => y(d.damage))
  .attr("height", (d) => 250 - y(d.damage))
  .style("opacity", 1); // Fade to fully visible
// Add Gradient
const defs = barSvg.append("defs");

const gradient = defs
  .append("linearGradient")
  .attr("id", "gradBar")
  .attr("x1", "0%")
  .attr("y1", "0%")
  .attr("x2", "0%")
  .attr("y2", "100%");

gradient
  .append("stop")
  .attr("offset", "0%")
  .attr("stop-color", "#42a5f5"); // Light Blue

gradient
  .append("stop")
  .attr("offset", "100%")
  .attr("stop-color", "#1e88e5"); // Darker Blue

// Add Emojis on Top
barSvg
  .selectAll(".emoji")
  .data(damageData)
  .enter()
  .append("text")
  .attr("class", "emoji")
  .attr("x", (d) => x(d.name) + x.bandwidth() / 2)
  .attr("y", (d) => y(d.damage) - 10)
  .attr("text-anchor", "middle")
  .attr("font-size", "20px")
  .text((d) => organEmojis[d.id] || "🔵"); // Default icon if missing
// X Axis (only once)
barSvg
  .append("g")
  .attr("transform", "translate(0,250)")
  .call(d3.axisBottom(x).tickSize(0))
  .call((g) =>
    g
      .selectAll("text")
      .style("font-size", "10px")
      .style("fill", "white")
      .attr("transform", "rotate(-40)")
      .style("text-anchor", "end")
  )
  .call((g) =>
    g.selectAll(".domain, .tick line").attr("stroke", "#cccccc")
  ); // make axis line light gray

// Y Axis (only once)
barSvg
  .append("g")
  .attr("transform", "translate(50,0)")
  .call(d3.axisLeft(y))
  .call((g) =>
    g
      .selectAll("text")
      .style("font-size", "10px")
      .style("fill", "white")
  )
  .call((g) =>
    g.selectAll(".domain, .tick line").attr("stroke", "#cccccc")
  ); // make axis line light gray

// Bounce animation on highlight
function updateInfo(organ) {
  const safeId = organ.id.replace(/\s+/g, "_");
  const data = damageData.find((d) => d.id === safeId);
  if (data) {
    infoBox
      .style("color", "black") // set font color to black
      .style("opacity", 0)     // start faded out for transition
      .html(`
<b>${data.name}</b><br><br>
${data.info}<br><br>
<b>Impact: ${data.damage}%</b>
`)
      .transition()
      .duration(500)
      .style("opacity", 1);    // fade in smoothly

    // Reset all bars properly
    d3.selectAll(".bar")
      .attr("class", "bar")
      .transition()
      .duration(300)
      .attr("transform", "scale(1)");

    // Highlight clicked bar and bounce
    d3.select(`#bar-${safeId}`)
      .attr("class", "bar highlighted")
      .transition()
      .duration(300)
      .attr("transform", "scale(1.1,1.1)")
      .transition()
      .duration(300)
      .attr("transform", "scale(1)");
  }
}

// Label on hover
function showLabel(event, id) {
  label
    .style("left", event.pageX + 10 + "px")
    .style("top", event.pageY - 20 + "px")
    .style("opacity", 1)
    .html(id.toUpperCase());
}
function hideLabel() {
  label.style("opacity", 0);
}
