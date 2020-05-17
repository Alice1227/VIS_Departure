let note = document.querySelector("#note");

function select() {

  let country = document.querySelector("#country").value;
  if (country !== "") {
    note.innerHTML = "*備註：<br>";
    update(dataset[country]);
  } else {
    note.innerHTML = "";
    d3.select('.chart').remove();
  }
}

const margin = {
  left: 80,
  right: 80,
  top: 60,
  bottom: 60
};
const padding = 10;
const width = 600;
const height = 400;

const white = "#fff";
const blue = "#4471C5";
const levelColors = ["#B5B5B5", "#FFCD1E", "#EB7424", "#E14F50"];

let formatComma = d3.format(",d");
let sortLevel = function(d) {
  let levelArray = d.level.split(",");
  let dateArray = d.date.split(",");
  let maxLevel;
  if (levelArray.length > 1) {
    maxLevel = levelArray[levelArray.length - 1];
    for (let i = 0; i < levelArray.length; i++) {
      note.innerHTML += "第" + levelArray[i] + "級發布於" + dateArray[i] + "<br>";
    }
  } else {
    maxLevel = levelArray[0];
    if (dateArray[0] !== "") {
      note.innerHTML += "第" + levelArray[0] + "級發布於" + dateArray[0] + "<br>"
    }
  }
  return levelColors[maxLevel];
}

let svg = d3.select('#graph')
  .append('svg')
  .attr('width', width)
  .attr('height', height);

function update(data) {
  d3.select('.chart').remove();
  let chart = svg.append('g').attr('class', 'chart');

  let xScale = d3.scaleBand()
    .domain([12, 1, 2, 3])
    .range([margin.left, width - margin.right])
    .padding(0.2);

  let y1Scale = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.passenger)])
    .range([height - margin.bottom, margin.top]);

  let y2Scale = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.plane)])
    .range([height - margin.bottom, margin.top]);

  let xAxis = d3.axisBottom(xScale)
    .tickFormat(d => d + " 月")
    .tickPadding(padding);

  let y1Axis = d3.axisLeft(y1Scale)
    .tickFormat(d => formatComma(d))
    .tickPadding(padding);

  let y2Axis = d3.axisRight(y2Scale)
    .tickPadding(padding);

  let axis = chart.append('g').attr('class', 'axis');
  // x axis
  axis.append('g')
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(xAxis);
  // y axis left
  axis.append('g')
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(y1Axis)
    .selectAll('text')
    .style('fill', blue)
    .style('font-weight', 'bold');
  // y axis right
  axis.append('g')
    .attr('transform', `translate(${width - margin.right}, 0)`)
    .call(y2Axis)
    .selectAll('text')
    .style('fill', levelColors[0])
    .style('font-weight', 'bold');
  // x axis title
  axis.append('text')
    .attr('text-anchor', 'middle')
    .attr('x', width / 2)
    .attr('y', height - 5)
    .text('月份');
  // y axis left title
  axis.append('text')
    .attr('text-anchor', 'end')
    .attr('x', margin.left - padding)
    .attr('y', margin.top - 20)
    .text('載客人數');
  // y axis right title
  axis.append('text')
    .attr('text-anchor', 'start')
    .attr('x', width - margin.right + padding)
    .attr('y', margin.top - 20)
    .text('飛機架數');

  axis.selectAll('text')
    .style('font-size', 14);

  // bar chart
  let barChart = chart.append('g').attr('class', 'bar-chart');

  let bar_tooltip = d3.tip()
    .attr('class', 'd3-tip bar-tip')
    .offset([-10, 0])
    .html(d => {
      return `<div>飛機架數 (${d.month}月)</div><div>${formatComma(d.plane)} 架</div>`;
    });
  barChart.call(bar_tooltip);

  let bar = barChart.selectAll('.bar').data(data);
  bar.enter()
    .append('rect')
    .attr('class', 'bar')
    .attr('fill', d => sortLevel(d))
    .attr('x', d => xScale(d.month))
    .attr('y', d => y2Scale(0))
    .attr('width', xScale.bandwidth())
    .attr('height', 0)
    .on("mouseover", bar_tooltip.show)
    .on("mouseout", bar_tooltip.hide)
    .transition()
    .duration(500)
    .delay((d, i) => i * 500)
    .ease(d3.easeLinear)
    .attr('y', d => y2Scale(d.plane))
    .attr('height', d => y2Scale(0) - y2Scale(d.plane));

  /*
  let barLabel = barChart.selectAll('.bar-label').data(data);
  barLabel.enter()
    .append('text')
    .attr('class', 'bar-label')
    .text('')
    .attr('x', d => xScale(d.month) + xScale.bandwidth() / 2)
    .attr('y', d => y2Scale(0) - 10)
    .attr('text-anchor', 'middle')
    .attr('font-size', 12)
    .transition()
    .duration(500)
    .delay((d, i) => i * 500)
    .ease(d3.easeLinear)
    .text(d => formatComma(d.plane))
    .attr('y', d => y2Scale(d.plane) - 10);
  */

  // line chart
  let lineChart = chart.append('g').attr('class', 'line-chart');
  let line_tooltip = d3.tip()
    .attr('class', 'd3-tip line-tip')
    .offset([-20, 0])
    .html(d => {
      return `<div>載客人數 (${d.month}月)</div><div>${formatComma(d.passenger)} 人</div>`;
    });
  lineChart.call(line_tooltip);

  let line = lineChart.append('path')
    .datum(data)
    .attr('class', 'line')
    .attr('fill', 'none')
    .attr('stroke', blue)
    .attr('stroke-width', 2)
    .attr('d', d3.line()
      .x(d => xScale(d.month) + xScale.bandwidth() / 2)
      .y(d => y1Scale(d.passenger)));
  let totalLength = line.node().getTotalLength();
  line.attr('stroke-dasharray', totalLength + " " + totalLength)
    .attr('stroke-dashoffset', totalLength)
    .transition()
    .duration(2000)
    .ease(d3.easeLinear)
    .attr('stroke-dashoffset', 0);

  let dot = lineChart.selectAll('.dot').data(data);
  dot.enter()
    .append('circle')
    .attr('class', 'dot')
    .attr('cx', d => xScale(d.month) + xScale.bandwidth() / 2)
    .attr('cy', d => y1Scale(d.passenger))
    .attr('fill', white)
    .attr('stroke', blue)
    .attr('stroke-width', 3)
    .attr('r', 0)
    .on("mouseover", line_tooltip.show)
    .on("mouseout", line_tooltip.hide)
    .transition()
    .duration(500)
    .delay((d, i) => i * 500)
    .ease(d3.easeLinear)
    .attr('r', 5);
  /*
    let dotLabel = lineChart.selectAll('.dot-label').data(data);
    dotLabel.enter()
      .append('text')
      .attr('class', 'dot-label')
      .text('')
      .attr('x', d => xScale(d.month) + xScale.bandwidth() / 2)
      .attr('y', d => y1Scale(d.passenger) - 20)
      .attr('text-anchor', 'middle')
      .attr('font-size', 12)
      .transition()
      .duration(500)
      .delay((d, i) => i * 500)
      .ease(d3.easeLinear)
      .text(d => formatComma(d.passenger));
  */

  // level label
  let levelLabel = chart.append('g').attr('class', 'level-label');
  let rectSize = 18;
  for (let i = 0; i < 4; i++) {
    levelLabel.append('rect')
      .attr('x', i * 80)
      .attr('y', 0)
      .attr('width', rectSize)
      .attr('height', rectSize)
      .style('fill', levelColors[i]);
    levelLabel.append('text')
      .attr('x', i * 80 + rectSize + 5)
      .attr('y', rectSize - 5)
      .text(() => {
        if (i > 0) {
          return "第 " + i + " 級";
        } else {
          return "未分級";
        }
      })
      .attr('font-size', 12);
  }
  levelLabel.attr('transform', `translate(${(width-300)/2},0)`);
}