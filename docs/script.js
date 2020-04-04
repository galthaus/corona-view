
var all_data = {
  usa: {
    include_total: true, // true, false
    math: "count",       // count, 3ema, ???
    rangeX: { start: "2020-01-01", end: "3000-00-00" },
    rangeY: "all", // all, top 10 on end, selector
    states: [],
    show: "cases",
    lines: [],
    layout: {},
    sort_order: "alpha",
    raw_data: {},
    scale: "linear",
    div: "usaDiv",
    min: 100,
},
  county: {
    include_total: true, // true, false
    math: "count",       // count, 3ema, ???
    rangeX: { start: "2020-01-01", end: "3000-00-00" },
    rangeY: "all", // all, top 10 on end, selector
    states: [],
    counties: [],
    show: "cases",
    lines: [],
    layout: {},
    sort_order: "alpha",
    raw_data: {},
    scale: "linear",
    div: "countyDiv",
    min: 20,
},
};

function rescale(g, elem) {
        var config = all_data[g];
        config.scale = elem.value;
        config.layout.yaxis.type = (elem.selectedIndex ? "log" : "linear");
        Plotly.newPlot(config.div, config.lines, config.layout);
}

function refunction(g, elem) {
        var config = all_data[g];
        config.math = elem.value;
        parse_data(g);
}

function redata(g, elem) {
        var config = all_data[g];
        config.show = elem.value;
        parse_data(g);
}

function resort(g, elem) {
        var config = all_data[g];
        config.sort_order = elem.value;
        parse_data(g);
}

function sort_lines(lines, method) {
        lines.sort(function(a, b) {
                if (method == "most") {
                        return b.y[b.y.length-1] - a.y[a.y.length-1];
                }
                if (method == "least") {
                        return a.y[a.y.length-1] - b.y[b.y.length-1];
                }
                if (a.name < b.name) {
                        return -1;
                }
                if (a.name > b.name) {
                        return 1;
                }
                return 0;
        });

        return lines;
}


function parse_data(table) {
        var config = all_data[table]
        var raw_data = all_data[table].raw_data

        var lines = {};
        var first, last;

        var dateIdx = 0;
        var nameIdx = 1;
        var countIdx = 3;
        if (table == "county") {
                countIdx += 1;
        }
        if (config.show == "deaths") {
                countIdx += 1;
        }

        for (i = 1; i < raw_data.length; i++) {
                var sdata = raw_data[i]
                if ((sdata[dateIdx] >= config.rangeX.start) && (sdata[dateIdx] <= config.rangeX.end)) {
                        var nd = parseInt(sdata[countIdx]);
                        // Skip entries until min met.
                        if (nd < config.min) {
                                continue
                        }

                        if (first === undefined) {
                                first = sdata[dateIdx];
                        }
                        last = sdata[dateIdx];
                        var state_data = lines[sdata[nameIdx]] || { name: sdata[nameIdx], type: "scatter", mode: "lines", x: [], y: [], r_y: []};

                        state_data.x.push(sdata[dateIdx]);

                        state_data.r_y.push(nd);
                        switch (config.math) {
                        case "count":
                                state_data.y.push(nd);
                                break;
                        case "3ema-count":
                                var prev = 0;
                                if (state_data.y.length > 1) {
                                        prev = state_data.y[state_data.y.length-1];
                                }
                                var ema = (nd * 0.5) + (prev * 0.5);
                                state_data.y.push(ema);
                                break;
                        case "diff":
                                var rprev = 0;
                                if (state_data.r_y.length > 1) {
                                        rprev = state_data.r_y[state_data.y.length-1];
                                }
                                nd = nd - rprev;
                                state_data.y.push(nd);
                                break;
                        case "3ema-diff":
                                var prev = 0;
                                var rprev = 0;
                                if (state_data.r_y.length > 1) {
                                        rprev = state_data.r_y[state_data.y.length-1];
                                        prev = state_data.y[state_data.y.length-1];
                                }
                                nd = nd - rprev;
                                var ema = (nd / 3) + (prev * 2 / 3);
                                state_data.y.push(ema);
                                break;
                        case "diff-percent":
                                var rprev = 0;
                                if (state_data.r_y.length > 1) {
                                        rprev = state_data.r_y[state_data.y.length-1];
                                }
                                if (rprev == 0) {
                                        nd = 100;
                                } else {
                                        nd = (nd / rprev - 1) * 100;
                                }
                                state_data.y.push(nd);
                                break;
                        case "3ema-diff-percent":
                                var prev = 0;
                                var rprev = 0;
                                if (state_data.r_y.length > 1) {
                                        rprev = state_data.r_y[state_data.y.length-1];
                                        prev = state_data.y[state_data.y.length-1];
                                }
                                if (rprev == 0) {
                                        nd = 100;
                                } else {
                                        nd = (nd / rprev - 1) * 100;
                                }
                                var ema = (nd / 3) + (prev * 2 / 3);
                                state_data.y.push(ema);
                                break;
                        }

                        lines[sdata[nameIdx]] = state_data;
                }
        }
        lines = Object.values(lines)
        if (config.math == "diff-percent") {
                lines.forEach(element => {
                        element.x.shift();
                        element.y.shift();
                        element.r_y.shift();
                });
        }
        lines = sort_lines(lines, config.sort_order)
        config.lines = lines;

        config.layout = {
  title: 'United States Per State Data for COVID-19 ' + config.show,
  barmode: 'group',
  xaxis: {
    autorange: true,
    range: [first, last],
    tickangle: -45,
    rangeselector: {buttons: [
        {
          count: 1,
          label: '1d',
          step: 'day',
          stepmode: 'backward'
        },
        {
          count: 7,
          label: '1w',
          step: 'week',
          stepmode: 'backward'
        },
        {step: 'all'}
      ]},
    rangeslider: {range: [first, last]},
    type: 'date'
  },
  yaxis: {
    autorange: true,
    type: config.scale
  }
};
        Plotly.newPlot(config.div, config.lines, config.layout);
}

$.ajax({
  type: "GET",
  url: "https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-states.csv",
  dataType: "text",
  success: function(response)
  {
	all_data.usa.raw_data = $.csv.toArrays(response);
        parse_data("usa");
  }
});

$.ajax({
  type: "GET",
  url: "https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-counties.csv",
  dataType: "text",
  success: function(response)
  {
	all_data.county.raw_data = $.csv.toArrays(response);
        parse_data("county");
  }
});

