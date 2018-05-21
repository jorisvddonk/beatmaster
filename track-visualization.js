import * as d3 from "d3";
module.exports = function(data) {
  var cellsize = 20;
  var width = cellsize * 4;
  var height = cellsize * 3;
  var colors = [
    "#f7fcf5",
    "#e5f5e0",
    "#c7e9c0",
    "#a1d99b",
    "#74c476",
    "#41ab5d",
    "#238b45",
    "#005a32"
  ];

  var notes_heatmapdata = data.track_data._notes
    .map(function(note) {
      return {
        horizontal: note._lineIndex, // 0 to 3, start from left
        vertical: note._lineLayer // 0 to 2, start from bottom
      };
    })
    .reduce(
      function(memo, val) {
        var index = val.vertical * 4 + val.horizontal;
        memo[index] = memo[index] + 1;
        return memo;
      },
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    )
    .map(function(v, i) {
      return {
        horizontal: i % 4,
        vertical: Math.floor(i / 4),
        value: v
      };
    });

  var svg = d3
    .select("#notes_heatmap")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g");

  var colorScale = d3.scaleLinear().domain([1,notes_heatmapdata.reduce(function(memo, x){return (x.value > memo ? x.value : memo)}, 0)])
  .interpolate(d3.interpolateRgb)
  .range([d3.rgb("#f7fbff"), d3.rgb('#08306b')]);

  var cells = svg.selectAll(".cell").data(notes_heatmapdata);

  cells.append("title");

  cells
    .enter()
    .append("rect")
    .attr("x", function(d) {
      return d.horizontal * cellsize;
    })
    .attr("y", function(d) {
      return d.vertical * cellsize;
    })
    .attr("width", cellsize)
    .attr("height", cellsize)
    .style("fill", function(d) {
      return colorScale(d.value);
    }).append('title').text(function(d){return d.value + ' notes'});

  cells.exit().remove();
};
