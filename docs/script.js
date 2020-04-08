
// GREG: Add per/capita
//
// GREG: Start projections

var stateAbbrevToCode = {
        TOTAL: "00",
	AL: "01",
	AK: "02",
        // Gap
	AZ: "04",
	AR: "05",
	CA: "06",
        // Gap
	CO: "08",
	CT: "09",
	DE: "10",
        DC: "11",
	FL: "12",
	GA: "13",
        // Gap
	HI: "15",
	ID: "16",
	IL: "17",
	IN: "18",
	IA: "19",
	KS: "20",
	KY: "21",
	LA: "22",
	ME: "23",
	MD: "24",
	MA: "25",
	MI: "26",
	MN: "27",
	MS: "28",
	MO: "29",
	MT: "30",
	NE: "31",
	NV: "32",
	NH: "33",
	NJ: "34",
	NM: "35",
	NY: "36",
	NC: "37",
	ND: "38",
	OH: "39",
	OK: "40",
	OR: "41",
	PA: "42",
        // Gap
	RI: "44",
	SC: "45",
	SD: "46",
	TN: "47",
	TX: "48",
	UT: "49",
	VT: "50",
	VA: "51",
        // Gap
	WA: "53",
	WV: "54",
	WI: "55",
	WY: "56",
}

var selectedTab='usa';
var all_data = {
  usa: {
    include_total: false, // true, false
    math: "count",       // count, 3ema, ???
    days_from: false,
    rangeX: { start: "2020-01-01", end: "3000-00-00" },
    rangeY: "all", // all, top 10 on end, selector
    states: [],
    show: "cases",
    lines: [],
    layout: {},
    sort_order: "alpha",
    raw_data: {},
    scale: "linear",
    selected: {},
    min: 100,
},
  county: {
    include_total: false, // true, false
    math: "count",       // count, 3ema, ???
    days_from: false,
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
    selected: {},
    min: 20,
},
};

function openData(evt, tab) {
  // Declare all variables
  var i, tablinks;

  // Get all elements with class="tablinks" and remove the class "active"
  tablinks = document.getElementsByClassName("tablinks");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }

  // Show the current tab, and add an "active" class to the button that opened the tab
  evt.currentTarget.className += " active";

  var umap = document.getElementById('vmap_usa');
  var cmap = document.getElementById('vmap_usa_county');

  if (tab == 'usa') {
          umap.style.display = "block";
          cmap.style.display = "none";
  } else {
          umap.style.display = "none";
          cmap.style.display = "block";
  }

  var elem;
  var config = all_data[tab];

  elem = document.getElementById("minRange");
  elem.value = config.min;
  elem = document.getElementById(config.math);
  elem.checked = true;
  elem = document.getElementById(config.scale);
  elem.checked = true;
  elem = document.getElementById(config.show);
  elem.checked = true;
  elem = document.getElementById(config.sort_order);
  elem.checked = true;
  elem = document.getElementById("days_from");
  elem.checked = config.days_from;
  elem = document.getElementById("include_total");
  elem.checked = config.include_total;

  selectedTab = tab;
  parse_data(tab);
}

function remin(elem) {
        var config = all_data[selectedTab];
        config.min = elem.value;

        var output = document.getElementById("usaMinValue");
        output.innerHTML = elem.value;

        parse_data(selectedTab);
}

function rescale(elem) {
        var config = all_data[selectedTab];
        config.scale = elem.value;
        config.layout.yaxis.type = elem.value;
        Plotly.newPlot('usaDiv', config.lines, config.layout);
}

function retotal(elem) {
        var config = all_data[selectedTab];
        config.include_total = elem.checked;
        parse_data(selectedTab);
}


function refunction(elem) {
        var config = all_data[selectedTab];
        config.math = elem.value;
        parse_data(selectedTab);
}

function redaysfrom(elem) {
        var config = all_data[selectedTab];
        config.days_from = elem.checked;
        parse_data(selectedTab);
}

function redata(elem) {
        var config = all_data[selectedTab];
        config.show = elem.value;
        parse_data(selectedTab);
}

function resort(elem) {
        var config = all_data[selectedTab];
        config.sort_order = elem.value;
        parse_data(selectedTab);
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
        var codeIdx = 2;
        var countIdx = 3;
        if (table == "county") {
                codeIdx += 1;
                countIdx += 1;
        }
        if (config.show == "deaths") {
                countIdx += 1;
        }

        for (i = 1; i < raw_data.length; i++) {
                var sdata = raw_data[i]
                if ((sdata[dateIdx] >= config.rangeX.start) && (sdata[dateIdx] <= config.rangeX.end)) {
                        if (config.include_total === false && (sdata[codeIdx] == "00")) {
                          continue
                        } else if (sdata[codeIdx] !== "00") {
                          if (Object.keys(config.selected).length > 0) {
                                var code = sdata[codeIdx];
                                var there = config.selected[code];
                                if (there !== true) {
                                        continue
                                }
                          }
                        }
                        var nd = parseInt(sdata[countIdx]);
                        // Skip entries until min met.
                        if (nd < config.min) {
                                continue
                        }
                        var state_data = lines[sdata[codeIdx]] || { name: sdata[nameIdx], type: "scatter", mode: "lines", x: [], y: [], r_y: []};

                        if (state_data.first == undefined) {
                                state_data.first = sdata[dateIdx];
                        }

                        var tx = sdata[dateIdx];
                        if (config.days_from == true) {
                                var ds = Date.parse(state_data.first);
                                var dn = Date.parse(sdata[dateIdx]);
                                tx = (dn - ds)/1000/60/60/24;
                        } else if (config.math == "diff-by-count") {
                                tx = nd
                        }

                        state_data.x.push(tx);
                        if (first === undefined) {
                                first = tx;
                        }
                        last = tx;

                        state_data.r_y.push(nd);
                        switch (config.math) {
                        case "diff-by-count":
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
                        case "days-to-double":
                                var prev = 0;
                                var rprev = 0;
                                if (state_data.r_y.length > 1) {
                                        rprev = state_data.r_y[state_data.y.length-1];
                                        prev = state_data.y[state_data.y.length-1];
                                        prev = (Math.pow(10, Math.log10(2) / prev) - 1) * 100;
                                }
                                if (rprev == 0) {
                                        nd = 100;
                                } else {
                                        nd = (nd / rprev - 1) * 100;
                                }
                                var ema = (nd / 3) + (prev * 2 / 3);
                                var dd = Math.log10(2) / Math.log10((ema/100)+1);
                                state_data.y.push(dd);
                                break;
                        }


                        lines[sdata[codeIdx]] = state_data;
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

        var titleStr = (table === "usa" ? "United States Per State Data" : "United States Per County Data")
        if (config.include_total) {
                titleStr += " with Total"
        }
        titleStr += " for COVID-19 "
        titleStr += (config.show === "deaths" ? "deaths" : "cases")

        config.layout = {
  title: titleStr,
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
  },
  yaxis: {
    autorange: true,
    type: config.scale
  }
};

  if (config.days_from == false) {
          config.layout.xaxis.type = 'date';
  }
  if (config.math == "diff-by-count") {
          config.layout.xaxis.type = 'log';
          config.layout.yaxis.type = 'log';
  }

  Plotly.newPlot('usaDiv', config.lines, config.layout);
}

function initCorona() {
$.ajax({
  type: "GET",
  url: "https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-states.csv",
  dataType: "text",
  success: function(response)
  {
	all_data.usa.raw_data = $.csv.toArrays(response);

        var totals = [];
        var cdate = "";
        var total;
        for (i = 1; i < all_data.usa.raw_data.length; i++) {
                var sdata = all_data.usa.raw_data[i]

                if (cdate !== sdata[0]) {
                        if (total !== undefined) {
                                totals.push(total);
                        }
                        cdate = sdata[0];
                        total = [sdata[0], "total", "00", parseInt(sdata[3]), parseInt(sdata[4])];
                } else {
                        total[3] += parseInt(sdata[3]);
                        total[4] += parseInt(sdata[4]);
                }
        }
        if (total !== undefined) {
            totals.push(total);
        }
        for (i = 0; i < totals.length; i++) {
                all_data.usa.raw_data.push(totals[i]);
        }


$.ajax({
  type: "GET",
  url: "https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-counties.csv",
  dataType: "text",
  success: function(response)
  {
	all_data.county.raw_data = $.csv.toArrays(response);
        var totals = [];
        var cdate = "";
        var total;
        for (i = 1; i < all_data.county.raw_data.length; i++) {
                var sdata = all_data.county.raw_data[i]

                if (cdate !== sdata[0]) {
                        if (total !== undefined) {
                                totals.push(total);
                        }
                        cdate = sdata[0];
                        total = [sdata[0], "total", "00", "00", parseInt(sdata[4]), parseInt(sdata[5])];
                } else {
                        total[4] += parseInt(sdata[4]);
                        total[5] += parseInt(sdata[5]);
                }
        }
        if (total !== undefined) {
            totals.push(total);
        }
        for (i = 0; i < totals.length; i++) {
                all_data.county.raw_data.push(totals[i]);
        }
        parse_data("usa");
  }
});
  }
});


        jQuery('#vmap_usa').vectorMap({
            map: 'usa_en',
            color: '#ffffff',
            enableZoom: true,
            showTooltip: true,
            selectedColor: '#838383',
            multiSelectRegion: true,
            hoverColor: null,
            onRegionSelect: function(event, code, region){
                    var t = stateAbbrevToCode[code.toUpperCase()];
                    all_data.usa.selected[t] = true;
                    parse_data('usa')
            },
            onRegionDeselect: function(event, code, region){
                    var t = stateAbbrevToCode[code.toUpperCase()];
                    delete all_data.usa.selected[t];
                    parse_data('usa')
            },
        });
        jQuery('#vmap_usa_county').vectorMap({
            map: 'usa_counties_en',
            color: '#ffffff',
            enableZoom: true,
            showTooltip: true,
            selectedColor: '#838383',
            multiSelectRegion: true,
            hoverColor: null,
            onRegionSelect: function(event, code, region){
                    all_data.county.selected[code] = true;
                    parse_data('county')
            },
            onRegionDeselect: function(event, code, region){
                    delete all_data.county.selected[code];
                    parse_data('county')
            },
        });

    // Get the element with id="defaultOpen" and click on it
    document.getElementById("defaultOpen").click();
}
