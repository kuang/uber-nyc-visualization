

var data = {};

data["monday"] = {};
data["tuesday"] = {};
data["wednesday"] = {};
data["thursday"] = {};
data["friday"] = {};
data["saturday"] = {};
data["sunday"] = {};

var svg, projection, selected_day, selected_time;

// var slider = document.getElementById('time');

selected_time = 0; //testing, set to 0

function parseUber(line) {
    // slider.onchange = function(){
    //     selected_time = slider.value;
    //     console.log(selected_time);
    // }
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
    svg.selectAll("circle").remove(); //removes previous circles
    day = day.toLowerCase();

    data[day][time].forEach(function (d) {
        var [cx, cy] = projection([d.long, d.lat]);
        //console.log(cx, cy)
        svg.append("circle")
            .attr("cx", cx)
            .attr("cy", cy)
            .attr("r", 1)
            .attr("fill", "black")
            .attr("opacity", 1);
    });
}

function set_selected_day(day) {
    selected_day = day;
    graphDots(day, selected_time);
}

function set_selected_time(time){
    selected_time = time
    graphDots(selected_day, selected_time);
}

function callback(
    error,
    uber,
    income,
) {
    //console.log(uber);
    if (error) console.log(error);

    var width = 600,
        height = 600;

    svg = d3.select("#map").append("svg")
        .attr("width", width)
        .attr("height", height);

    projection = d3.geoAlbers()
        .center([0, 40.7])
        .rotate([74, 0])
        .translate([width / 2, height / 2])
        .scale(75000);

    var path = d3.geoPath()
        .projection(projection);

    d3.json("data/nyc.json", function (error, uk) {
        console.log(uk);
        console.log(uk.objects);
        if (error) return console.error(error);
        var subunits = topojson.feature(uk, uk.objects.nyc_zip_code_areas);

        svg.append("path")
            .datum(subunits)
            .attr("d", path);

        // graphDots("tuesday", 12); //call this to graph uber dots!

    });



}

// To make sure that elements don't generate before the DOM has loaded.
$(document).ready(function () {
    var svg = d3.select("svg");

    d3.queue()
        .defer(d3.csv, "data/uber-raw-data-apr14.csv", parseUber)
        // .defer(d3.csv, "data/uber_test.csv", parseUber)
        .defer(d3.csv, "data/zipcode_income.csv", parseIncome)
        .await(callback);
});


// steph attempt at mapping
// https://bl.ocks.org/shimizu/61e271a44f9fb832b272417c0bc853a5
