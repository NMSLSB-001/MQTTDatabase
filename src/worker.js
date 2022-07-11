const serviceId = "1000000001";
var querystring = require("querystring");
var http = require("http");
var axios = require("axios");
var fs = require("fs");
const { workerData, parentPort } = require("worker_threads");

var intervalid = setInterval(statusUpdate, 20000);
console.log("Intervalid", intervalid)

function statusUpdate() {
  var timeStamp = getTimestamp();
  var post_data = JSON.stringify();
  console.log(timeStamp);
  StatusPost(timeStamp);
  console.log("Sending Out");
}

function StatusPost(timeStamp) {
  axios
    .post("http://localhost:8887/api/updateDataProStatus", {
      serviceId: serviceId,
      isDaProRunning: 1,
      isDaProRunningLC: timeStamp,
    })
    .then((res) => {
      console.log(`Status Code: ${res.statusCode}`);
      console.log(res);
    })
    .catch((error) => {
      console.error(error);
    });

  sleep(15000);
}

function getTimestamp() {
  return Math.floor(Date.now() / 1000).toString();
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
      "Content-Length": post_data.length,
    },
  };

  // Set up the request
  var post_req = http.request(post_options, function (res) {
    res.setEncoding("utf8");
    console.log(`Status Code: ${res.statusCode}`);
    res.on("data", (d) => {
      process.stdout.write(d);
    });
  });

  post_req.on("error", (error) => {
    console.error(error.code);
  });
  console.log("1");
  // post the data
  post_req.write(post_data);
  post_req.end();
}
// sleep for a while
function sleep(d) {
  for (var t = Date.now(); Date.now() - t <= d; );
}
