import * as d3 from "d3";
module.exports = function(data) {
  var cellsize = 20;

  var ordered_notes = data.track_data._notes.sort(function(a,b){
    if (a._time < b._time) {
        return -1;
    } else if (a._time > b._time) {
        return 1;
    }
    return 0;
  });

  var genLocationsHeatmapData = function(filter) {
    if (!filter) {
      filter = function(){return true;};
    }
    return data.track_data._notes.filter(filter)
    .map(function(note) {
      return {
        horizontal: note._lineIndex, // 0 to 3, start from left
        vertical: 2 - note._lineLayer // 0 to 2, start from bottom
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
  }

  var notes_heatmapdata = genLocationsHeatmapData();
  var notes_heatmapdata_red = genLocationsHeatmapData(function(x){return x._type == 0});
  var notes_heatmapdata_blue = genLocationsHeatmapData(function(x){return x._type == 1});
    
    //Note cut direction (0 = up, 1 = down, 2 = left, 3 = right, 4 = up left, 5 = up right, 6 = down left, 7 = down right, 8 = no direction)
    var cutDirPositionsInHeatmap = [
      {horizontal: 1, vertical: 0},
      {horizontal: 1, vertical: 2},
      {horizontal: 0, vertical: 1},
      {horizontal: 2, vertical: 1},
      {horizontal: 0, vertical: 0},
      {horizontal: 2, vertical: 0},
      {horizontal: 0, vertical: 2},
      {horizontal: 2, vertical: 2},
      {horizontal: 1, vertical: 1}
    ];
    var notedirection_heatmapdata = data.track_data._notes
    .map(function(note) {
      return cutDirPositionsInHeatmap[note._cutDirection];
    })
    .reduce(
      function(memo, val) {
        var index = val.vertical * 3 + val.horizontal;
        memo[index] = memo[index] + 1;
        return memo;
      },
      [0, 0, 0, 0, 0, 0, 0, 0, 0]
    )
    .map(function(v, i) {
      return {
        horizontal: i % 3,
        vertical: Math.floor(i / 3),
        value: v
      };
    });

  var TIMES_STACKED_CELLS = 4;
  var DIV = data.track_data._beatsPerBar / TIMES_STACKED_CELLS;
  var notetimes_heatmapdata = Array.apply(null, Array(Math.ceil(ordered_notes[ordered_notes.length-1]._time/DIV))).map(function(x){return 0;});
  ordered_notes.forEach(function(note){
    notetimes_heatmapdata[Math.floor(note._time/DIV)] += 1;
  });
  var getPosition = function(index) {
    return {
      horizontal: Math.floor(index / TIMES_STACKED_CELLS),
      vertical: Math.floor(index % TIMES_STACKED_CELLS),
    }
  }
  notetimes_heatmapdata = notetimes_heatmapdata.map(function(value, index){
    var retval = getPosition(index);
    retval.value = value;
    return retval;
  });

  var renderChart = function(id, data, width, height, colorFrom, colorTo) {
    if (!colorFrom) {
      colorFrom = '#f7fbf7';
    }
    if (!colorTo) {
      colorTo = '#083008';
    }
    var svg = d3
    .select(id)
    .append("svg")
    if (width) {
      svg.attr("width", cellsize * width);
    }
    if (height) {
      svg.attr("height", cellsize * height);
    }
    svg.append("g");

  var colorScale = d3.scaleLinear().domain([1,data.reduce(function(memo, x){return (x.value > memo ? x.value : memo)}, 0)])
  .interpolate(d3.interpolateRgb)
  .range([d3.rgb(colorFrom), d3.rgb(colorTo)]);

  var cells = svg.selectAll(".cell").data(data);
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
  }

  renderChart('#notes_heatmap', notes_heatmapdata, 4, 3);
  renderChart('#notes_heatmap_red', notes_heatmapdata_red, 4, 3, '#f7fbf7', '#900808');
  renderChart('#notes_heatmap_blue', notes_heatmapdata_blue, 4, 3, '#f7fbf7', '#080890');
  renderChart('#notedirections_heatmap', notedirection_heatmapdata, 3, 3);
  renderChart('#notetimes_heatmap', notetimes_heatmapdata, undefined, TIMES_STACKED_CELLS);
};
