
function parseLine(line) {
    // console.log(line);
    return {
        day: line["Day"],
        time: line["Time"],
        lat: parseFloat(line["Lat"]),
        long: parseFloat(line["Long"])
    };
}

function callback(
    error,
    data
) {
    console.log(data);
    if (error) console.log(error);

}

// To make sure that elements don't generate before the DOM has loaded.
$(document).ready(function () {
    var svg = d3.select("svg");

    d3.queue()
        .defer(d3.csv, "data/uber-raw-data-apr14.csv", parseLine)
        .await(callback);
});


// steph attempt at mapping
// https://bl.ocks.org/shimizu/61e271a44f9fb832b272417c0bc853a5
var projection = d3
        .geoMercator() 
        .scale(16000)   
        .rotate([-0.25, 0.25, 0]) 
        .center([139.0032936, 36.3219088]); 
    
    var path = d3.geoPath().projection(projection);　
    
    var map = d3.select("body")
        .append("svg")
        .attr("width", 960)
        .attr("height", 500); 
    
    
    d3.json("data/nyc_zip_code_areas.geojson", drawMaps);
    
    function drawMaps(geojson) {
        map.selectAll("path")
            .data(geojson.features)
            .enter()
            .append("path")
            .attr("d", path) 
            .attr("fill", "green")
            .attr("fill-opacity", 0.5)
            .attr("stroke", "#222");    
    }
