
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
    console.log(uber);
    if (error) console.log(error);

    // TODO: CLOROPLETH MAPPING
    d3.json("data/nyc.json", function (error, uk) {
    // console.log(uk);
    // console.log(uk.objects);
    if (error) return console.error(error);
    var subunits = topojson.feature(uk, uk.objects.nyc_zip_code_areas);

    svg.selectAll(".tract")
    // bind data to the selection
        .data(topojson.feature(uk, uk.objects.nyc_zip_code_areas).features)
        .enter()
        // set properties for the new elements:
        .append("path")
        // .attr('fill',function(d,i) { return colorScale(lookup[d.postalcode]); })
        .attr('fill',function(d, i) { return color(i); })
        .attr("class", "tract")
        .attr("d", path);

});



}


    

// To make sure that elements don't generate before the DOM has loaded.
$(document).ready(function () {
    var svg = d3.select("svg");

    d3.queue()
        .defer(d3.csv, "data/uber-raw-data-apr14.csv", parseUber)
        .defer(d3.csv, "data/zipcode_income.csv", parseIncome)
        .await(callback);
});



var width = 780,
    height = 780;

var viewbox = "0 0 500 500";

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewbox", viewbox);

var projection = d3.geoAlbers()
    .center([0, 40.7])
    .rotate([74, 0])
    .translate([width / 2, height / 2])
    .scale(85000);

var path = d3.geoPath()
    .projection(projection);

// coloring by income
    // green to white color scale
    var colorScale = d3.scaleThreshold()
        .domain([1520, 219554])
        .range(["#006600", "#ffffff"]);

    var color = d3.scaleOrdinal(d3.schemeCategory20);

    // console.log(income);
    // var lookup = {};
    // income.forEach(function(d) { console.log(d); lookup[d.zipcode] = +d.income; });
    // console.log(lookup);






