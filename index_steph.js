
var data = {};

data["monday"] = {};
data["tuesday"] = {};
data["wednesday"] = {};
data["thursday"] = {};
data["friday"] = {};
data["saturday"] = {};
data["sunday"] = {};

var svg, projection, selected_day, selected_time;

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


function callback(
    error,
    uber,
    income,
) {
    // console.log(uber);
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

    // coloring by income
    var incomeColors = ["#ffffff", "#5aad5a", "#1e5b1e"];
    var colorScale = d3.scaleLinear().domain([18024, 85019, 219554]).range(incomeColors);

    // tool tips
    var div = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

    var lookup = {};
    income.forEach(function (d) { lookup[d.zipcode] = +d.income; });
    // console.log(income[]);


    d3.json("data/nyc.json", function (error, uk) {

        if (error) return console.error(error);
        var subunits = topojson.feature(uk, uk.objects.nyc_zip_code_areas);

        svg.selectAll(".tract")
            // bind data to the selection
            .data(topojson.feature(uk, uk.objects.nyc_zip_code_areas).features)
            .enter()
            // set properties for the new elements:
            .append("path")
            .attr('fill', function (d, i) { 
                if(lookup[d.properties.postalcode] == undefined) { 
                    return "white";
                } else {
                    console.log(lookup[i]); 
                    return colorScale(lookup[d.properties.postalcode]);
                }
            })
            .attr("class", "tract")
            .attr("d", path)

            .on("mouseover", function(d) {
               div.transition()
                 .duration(200)
                 .style("opacity", .9);
               div.html("Zip Code:<br>" + d.properties.postalcode + "<br>Income:<br>$" + lookup[d.properties.postalcode])
                 .style("left", (d3.event.pageX) + "px")
                 .style("top", (d3.event.pageY - 28) + "px");
               })
             .on("mouseout", function(d) {
               div.transition()
                 .duration(500)
                 .style("opacity", 0);
               });
    });


}

// To make sure that elements don't generate before the DOM has loaded.
$(document).ready(function () {
    var svg = d3.select("svg");

    d3.queue()
        .defer(d3.csv, "data/uber-raw-data-apr14.csv", parseUber)
        // .defer(d3.csv, "data/uber_test.csv", parseUber)
        .defer(d3.csv, "data/zip_medians.csv", parseIncome)
        .await(callback);
});

