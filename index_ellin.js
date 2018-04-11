
function parseUber(line) {
    // console.log(line);
    return {
        day: line["Day"],
        time: parseInt(line["Time"].substr(0, 1)),
        lat: parseFloat(line["Lat"]),
        long: parseFloat(line["Long"])
    };
}

function parseIncome(line) {
    // console.log(line);
    return {
        zipcode: line["Zip"],
        income: parseInt(line["Median"]),
        population: parseInt(line["Pop"])
    };
}

function callback(
    error,
    uber,
    income,
) {
    //console.log(uber);
    if (error) console.log(error);

    uber.forEach(function (d){
        var [cx, cy] = projection([d.long, d.lat]);
        //console.log(cx, cy)
        svg.append("circle")
        .attr("cx", cx)
        .attr("cy", cy)
        .attr("r", 1)
        .attr("fill", "black")
        .attr("opacity", 1);
    });



    //everything ha

}

// To make sure that elements don't generate before the DOM has loaded.
$(document).ready(function () {
    var svg = d3.select("svg");

    d3.queue()
        .defer(d3.csv, "data/uber-raw-data-apr14.csv", parseUber)
        .defer(d3.csv, "data/zipcode_income.csv", parseIncome)
        .await(callback);
});


// steph attempt at mapping
// https://bl.ocks.org/shimizu/61e271a44f9fb832b272417c0bc853a5

var width = 780,
    height = 780;

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

var projection = d3.geoAlbers()
    .center([0, 40.7])
    .rotate([74, 0])
    .translate([width / 2, height / 2])
    .scale(85000);

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
});