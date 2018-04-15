

var data = {};

data["monday"] = {};
data["tuesday"] = {};
data["wednesday"] = {};
data["thursday"] = {};
data["friday"] = {};
data["saturday"] = {};
data["sunday"] = {};

var map_svg, plot_svg, projection, selected_day, selected_time;
var xScale = d3.scaleLinear().domain([0, 23]).range([0, 300]);


selected_day = "monday";
selected_time = 0; //testing, set to 0

function parseUber(line) {
    var ne = [40.91525559999999, -73.70027209999999];
    var sw = [40.4913686, -74.25908989999999];

    var se_hudson = [40.661295, -74.023930];
    var ne_hudson = [40.921274, -73.917945];

    var lat = parseFloat(line["Lat"]);
    var long = parseFloat(line["Long"]);
    var day = line["Day"];
    var time = parseInt(line["Time"].substr(0, 2));
    // console.log(time);
    var obj = {
        // day: line["Day"],
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
    // console.log(line);
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
        map_svg.append("circle")
            .attr("cx", cx)
            .attr("cy", cy)
            .attr("r", 1)
            .attr("fill", "white")
            .attr("opacity", 1);
    });
}

function set_selected_day(day) {
    selected_day = day;
    graphDots(day, selected_time);
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
    // console.log(data[day]);
    // console.log(time_lengths);
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
        .attr("r", 4)
        .attr("cx", function (d) { return xScale(d.hour) })
        .attr("cy", function (d) { return yScale(d.number) })
        .style("fill", function (d) {
            return "#00c4c8";
        })

}


function callback(
    error,
    uber,
    income,
) {
    //console.log(uber);
    if (error) console.log(error);

    var map_width = 600,
        map_height = 600;

    var plot_width = 400,
        plot_height = 400;

    var padding = 70;


    map_svg = d3.select("#map").append("svg")
        .attr("width", map_width)
        .attr("height", map_height);

    plot_svg = d3.select("#time").append("svg")
        .attr("height", 300 + 2 * padding).attr("width", 300 + 2 * padding)
        .append("g").attr("transform", "translate(" + padding + "," + padding + ")");




    projection = d3.geoAlbers()
        .center([0, 40.7])
        .rotate([74, 0])
        .translate([map_width / 2, map_height / 2])
        .scale(75000);

    var path = d3.geoPath()
        .projection(projection);

    d3.json("data/nyc.json", function (error, uk) {
        // console.log(uk);
        // console.log(uk.objects);
        if (error) return console.error(error);
        var subunits = topojson.feature(uk, uk.objects.nyc_zip_code_areas);

        map_svg.append("path")
            .datum(subunits)
            .attr("d", path);

        // graphDots("tuesday", 12); //call this to graph uber dots!
        // graphTime(selected_day);
    });



}

// To make sure that elements don't generate before the DOM has loaded.
$(document).ready(function () {
    d3.queue()
        .defer(d3.csv, "data/uber-raw-data-apr14.csv", parseUber)
        // .defer(d3.csv, "data/uber_test.csv", parseUber)
        .defer(d3.csv, "data/zipcode_income.csv", parseIncome)
        .await(callback);
});


// steph attempt at mapping
// https://bl.ocks.org/shimizu/61e271a44f9fb832b272417c0bc853a5
