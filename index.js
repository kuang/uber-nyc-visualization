
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
