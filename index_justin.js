

var data = {};

data["monday"] = {};
data["tuesday"] = {};
data["wednesday"] = {};
data["thursday"] = {};
data["friday"] = {};
data["saturday"] = {};
data["sunday"] = {};

var map_svg, plot_svg, projection, selected_day, selected_time, zoom, g;
var xScale = d3.scaleLinear().domain([0, 23]).range([0, 300]);

selected_time = 12; //testing, set to 0
selected_day = "monday"; //default. we can at some point


function parseUber(line) {

    var ne = [40.91525559999999, -73.70027209999999];
    var sw = [40.4913686, -74.25908989999999];

    var se_hudson = [40.661295, -74.023930];
    var ne_hudson = [40.921274, -73.917945];

    var lat = parseFloat(line["Lat"]);
    var long = parseFloat(line["Long"]);
    var day = line["Day"];
    var time = parseInt(line["Time"].substr(0, 2));

    var obj = {
        time: time,
        lat: lat,
        long: long,
    };

    //sanity check
    if (lat < ne[0] && lat > sw[0] && long < ne[1] && long > sw[1]) {
        //left of hudson check
        if (!(lat > se_hudson[0] && long < se_hudson[1])) {
            day = day.toLowerCase();
            if (!data[day].hasOwnProperty(time))
                data[day][time] = [];
            data[day][time].push(obj);
        }
        // console.log(line);
    }

}

function parseIncome(line) {
    return {
        zipcode: line["Zip"],
        income: parseInt(line["Median"]),
        population: parseInt(line["Pop"])
    };
}

//day is a string, time is an int 0-23
function graphDots(day, time) {
    map_svg.selectAll("circle").remove(); //removes previous circles
    day = day.toLowerCase();

    data[day][time].forEach(function (d) {
        var [cx, cy] = projection([d.long, d.lat]);
        //console.log(cx, cy)
        g.append("circle")
            .attr("cx", cx)
            .attr("cy", cy)
            .attr("r", 1)
            .attr("fill", "orange")
            .attr("opacity", 1);
    });
}

function set_selected_day(day) {
    selected_day = day;
    graphDots(day, selected_time);
    graphTime(selected_day);
}

function set_selected_time(time) {
    selected_time = time;
    graphDots(selected_day, selected_time);
    graphTime(selected_day);
}


function graphTime(day) {
    plot_svg.selectAll("*").remove();

    var max = Number.MIN_SAFE_INTEGER;
    var min = Number.MAX_SAFE_INTEGER;
    var time_lengths = [];
    for (var i = 0; i < 24; i++) {
        var curr_len = data[day][i].length;
        if (curr_len > max)
            max = curr_len;
        if (curr_len < min)
            min = curr_len;
        time_lengths.push({
            hour: i,
            number: curr_len
        });
    }
    var yScale = d3.scaleLinear().domain([min, max]).range([300, 0]);
    var lineGenerator = d3.area()
        .x(d => xScale(d.hour))
        .y(d => yScale(d.number));

    plot_svg.append("path")
        .attr("d", lineGenerator(time_lengths))
        .style("stroke", "#000000")
        .style("fill", "none");

    // Add axes
    plot_svg.append("g").call(d3.axisLeft(yScale)).attr("transform", "translate(0,0)");
    plot_svg.append("g").call(d3.axisBottom(xScale)).attr("transform", "translate(0," + (300) + ")");

    plot_svg.append("text").attr("transform", "rotate(270) translate(-170, -50)").text("Number of Pickups");
    plot_svg.append("text").attr("transform", "translate(150, 340)").text("Hour");

    plot_svg.selectAll("dot").data(time_lengths)
        .enter().append("circle")
        .attr("r", function (d) {
            if (d.hour == selected_time) return 8;
            return 4;

        })
        .attr("cx", function (d) { return xScale(d.hour) })
        .attr("cy", function (d) { return yScale(d.number) })
        .style("fill", function (d) {
            if (d.hour == selected_time) return "#ff6661";
            return "#00c4c8";
        })


}



function callback(
    error,
    uber,
    income,
) {

    if (error) console.log(error);

    var width = 600,
        height = 600,
        active = d3.select(null);

    var plot_width = 400,
        plot_height = 400;

    var padding = 70;

    var zoom = d3.zoom()
        .scaleExtent([1, 8])
        .on("zoom", zoomed);


    map_svg = d3.select("#map").append("svg")
        .attr("width", width)
        .attr("height", height);

    projection = d3.geoAlbers()
        .center([0, 40.7])
        .rotate([74, 0])
        .translate([width / 2, height / 2])
        .scale(75000);

    var path = d3.geoPath()
        .projection(projection);

    g = map_svg.append("g");


    map_svg.append("rect")
        .attr("class", "overlay")
        .attr("width", width)
        .attr("height", height);


    map_svg.call(zoom);


    // coloring by income
    // green to white color scale
    var colorScale = d3.scaleLinear()
        .domain([1520, 219554])
        .range(["#006600", "#ffffff"]);

    var color = d3.scaleOrdinal(d3.schemeCategory20);

    var lookup = {};
    income.forEach(function (d) { lookup[d.zipcode] = +d.income; });

    plot_svg = d3.select("#time").append("svg")
        .attr("height", 300 + 2 * padding).attr("width", 300 + 2 * padding)
        .append("g").attr("transform", "translate(" + padding + "," + padding + ")");


    d3.json("data/nyc.json", function (error, uk) {
        if (error) return console.error(error);
        var subunits = topojson.feature(uk, uk.objects.nyc_zip_code_areas);


        g.append("path")
            .datum(subunits)
            .attr("d", path)
            .attr("class", "feature")
            .on("click", clicked);


        g.append("path")
            .datum(topojson.merge(uk, uk.objects.nyc_zip_code_areas.geometries))
            .attr("class", "land")
            .attr("d", path);


        g.append("path")
            .datum(topojson.mesh(uk, uk.objects.nyc_zip_code_areas))
            .attr("class", "mesh")
            .attr("d", path);


        g.selectAll(".tract")
            .data(topojson.feature(uk, uk.objects.nyc_zip_code_areas).features)
            .enter()
            .append("path")
            .attr('fill', function (d, i) { return colorScale(lookup[d.properties.postalcode]); })
            .attr("class", "tract")
            .attr("d", path);
        graphTime(selected_day);
        graphDots(selected_day, selected_time);
    });

}


function clicked(d) {
    if (active.node() === this) return reset();
    active.classed("active", false);
    active = d3.select(this).classed("active", true);

    var bounds = path.bounds(d),
        dx = bounds[1][0] - bounds[0][0],
        dy = bounds[1][1] - bounds[0][1],
        x = (bounds[0][0] + bounds[1][0]) / 2,
        y = (bounds[0][1] + bounds[1][1]) / 2,
        scale = Math.max(1, Math.min(8, 0.9 / Math.max(dx / width, dy / height))),
        translate = [width / 2 - scale * x, height / 2 - scale * y];

    map_svg.transition()
        .duration(750)
        .call(zoom.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
}


function reset() {
    active.classed("active", false);
    active = d3.select(null);

    map_svg.transition()
        .duration(750)
        .call(zoom.transform, d3.zoomIdentity);
}

function zoomed() {
    g.style("stroke-width", 1.5 / d3.event.transform.k + "px");
    g.attr("transform", d3.event.transform);
}

// To make sure that elements don't generate before the DOM has loaded.
$(document).ready(function () {
    var map_svg = d3.select("svg");

    d3.queue()
        // .defer(d3.csv, "data/uber-raw-data-apr14.csv", parseUber)
        .defer(d3.csv, "data/uber_april_oneweek.csv", parseUber)
        .defer(d3.csv, "data/zip_medians.csv", parseIncome)
        .await(callback);
});


