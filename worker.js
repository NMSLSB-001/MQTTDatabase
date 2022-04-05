var querystring = require("querystring");
var http = require("http");
var fs = require("fs");
const { workerData, parentPort } = require("worker_threads");

function statusUpdate() {
  while (1) {
    console.log(string);
    sleep(500);
  }
}

// We need this to build our post string
function PostCode(post_data) {
  // Build the post string from an object
  // An object of options to indicate where to post to
  var post_options = {
    host: "localhost",
    port: "8887",
    path: "/api/updateDataProStatus",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(post_data),
    },
  };

  // Set up the request
  var post_req = http.request(post_options, function (res) {
    res.setEncoding("utf8");
    res.on("data", function (chunk) {
      console.log("Response: " + chunk);
    });
  });

  // post the data
  post_req.write(post_data);
  post_req.end();
}
// sleep for a while
function sleep(d) {
  for (var t = Date.now(); Date.now() - t <= d; );
}
