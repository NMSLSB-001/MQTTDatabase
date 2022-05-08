const deviceId = "1111111111";
var previous = [];
/** 
const { Worker } = require("worker_threads");

const runSerice = (workerData) => {
  return new Promise((resolve, reject) => {
    const worker = new Worker("./worker.js", { workerData });
    worker.on("message", resolve);
    worker.on("error", reject);
    worker.on("exit", (code) => {
      if (code !== 0)
        reject(new Error(`Worker Thread stopped with exit code ${code}`));
    });
  });
};
*/
const { statSync } = require("fs");
var mqtt = require("mqtt"); // https://www.npmjs.com/package/mqtt
var Topic = "search"; // subscribe to all topics
var Broker_URL = "mqtt://mqtt.drivethru.top";
var Database_URL = "database.drivethru.top";

var options = {
  clientId: "MyMQTT",
  port: 1883,
  username: "test",
  password: "123456",
  keepalive: 60,
};

var client = mqtt.connect(Broker_URL, options);
var clientInfo = [Broker_URL, options];
// worker_thread(clientInfo);
client.on("connect", mqtt_connect);
client.on("reconnect", mqtt_reconnect);
client.on("message", mqtt_messsageReceived);
client.on("close", mqtt_close);

function worker_thread(clientInfo) {
  const run = async () => {
    const result = await runSerice(clientInfo);
    console.log(result);
  };

  run().catch((err) => console.error(err));
}

function mqtt_connect() {
  console.log("Connecting MQTT");
  client.subscribe(Topic, mqtt_subscribe);
}

function mqtt_subscribe(err, granted) {
  console.log("Subscribed to " + Topic);
  if (err) {
    console.log(err);
  }
}

function mqtt_reconnect(err) {
  date = new Date();
  console.log("Reconnect MQTT" + ": " + date);
  if (err) {
    console.log(err);
  }
  client = mqtt.connect(Broker_URL, options);
}

function after_publish() {
  // do nothing
}

// receive a message from MQTT broker
function mqtt_messsageReceived(topic, message, packet) {
  var message_str = message.toString(); // convert byte array to string
  // payload syntax: clientID,topic,message
  if (message_str.length == 0) {
    console.log("Invalid payload");
  } else {
    message_str_obj = receivedDataProcessing(message_str);
    if (isDuplicate(message_str_obj["carPlate"])) {
      insert_message(topic, message_str_obj, packet);
      console.log("Insert successfully");
    }
    previous.shift();
    previous.push(message_str_obj["carPlate"]);
  }
}
function receivedDataProcessing(message_str) {
  console.log("Debug 1:" + message_str);
  let decodeMessageStr = Buffer.from(message_str,'base64').toString('utf-8')
  console.log("Debug 2:" + decodeMessageStr);
  messageResult = JSON.parse(decodeMessageStr);
  // var decodeMessageStr = Buffer.from(message, "base64").toString(); // convert encode to decode
  // console.log("message to string", message_str);
  // console.log("Debug 2:" + message_str);
  // console.log("Debug 3:" + message_str["timestamp"]);
  // message_str = message_str.replace(/\n$/, ""); //remove new line
  // message_str = message_str.toString().split("|");
  // console.log("message to params array", message_str);
  return messageResult;
}

function isDuplicate(carPlate) {
  var isDup = true;
  for (var i = 0; i < 10; i++) {
    if (carPlate == previous[i]) {
      isDup = false;
    }
  }
  return isDup;
}

function mqtt_close() {
  client.end();
  console.log("Close MQTT");
}

////////////////////////////////////////////////////
///////////////////// MYSQL ////////////////////////
////////////////////////////////////////////////////
var mysql = require("mysql"); // https://www.npmjs.com/package/mysql
// Create Connection
var connection = mysql.createConnection({
  host: Database_URL,
  user: "cto",
  password: "123456",
  port: 33060,
  database: "mqttold",
});

handleError();

function handleError() {
  connection.connect(function (err) {
    if (err) {
      console.log("error when connecting to db:", err);
      setTimeout(handleError, 2000);
    }
    // console.log("Database Connected!");
  });

  //监听错误
  connection.on("error", function (err) {
    console.log("db error", err);
    // 如果是连接断开，自动重新连接
    if (err.code === "PROTOCOL_CONNECTION_LOST") {
      handleError();
    } else {
      throw err;
    }
  });
}

// insert a row into the tbl_messages table
function insert_message(topic, message_str, packet) {
  // var message_arr = extract_string(message_str); //split a string into an array
  // change message to message_arr[0],since no clientID
  // var clientID= message_arr[0];
  // var message = message_arr[1];
  var clientID = "zan shi mei you";
  var message = JSON.stringify(message_str)
  var date = new Date();
  var currTime = currentTime();
  var sql1 = "INSERT INTO ?? (??,??,??,??,??) VALUES (?,?,?,?,?)";
  var params1 = [
    "tbl_messages",
    "clientID",
    "topic",
    "message",
    "date",
    "currTime",
    clientID,
    topic,
    message,
    date,
    currTime,
  ];
  sql1 = mysql.format(sql1, params1);

  connection.query(sql1, function (error, results) {
    if (error) throw error;
    console.log("Message added: " + message);
  });

  comparison(message);
  // callTime(message);
}

// get time
function currentTime() {
  var d = new Date();
  var str = "";
  str += d.getHours() + ":";
  str += d.getMinutes() + ":";
  str += d.getSeconds();
  return str;
}

// split a string into an array of substrings
function extract_string(message_str) {
  // var message_arr = message_str.split(","); //convert to array
  // var message = message_arr[0];
  // message = message_str.toUpperCase();
  message = message_str.replace(/\s*/g, "");
  return message;
}

// count number of delimiters in a string
var delimiter = ",";
function countInstances(message_str) {
  var substrings = message_str.split(delimiter);
  return substrings.length - 1;
}

// sleep for a while
function sleep(d) {
  for (var t = Date.now(); Date.now() - t <= d; );
}

// get usrsname car plate
function comparison(message) {
  var sql2 =
    "SELECT studentName, studyYear, studyGroup FROM stuCarplate WHERE carplateNum = ?";
  var params2 = [message];
  connection.query(sql2, params2, function (err, results, fields) {
    if (err) {
      throw err;
    }
    console.log(results);
    if (results[0] != null) {
      for (i in results) {
        msg = results[i];
        client.publish(
          "inTopic",
          msg["studentName"].toString() +
            msg["studyYear"].toString() +
            msg["studyGroup"].toString(),
          { qos: 0, retain: true }
        );
        console.log(
          "debug",
          msg["studentName"].toString() +
            msg["studyYear"].toString() +
            msg["studyGroup"].toString()
        );
        console.log(message);
        var detCarPlate = message;
        addToHistory(
          detCarPlate,
          1,
          msg["studentName"].toString(),
          msg["studyYear"].toString() + msg["studyGroup"].toString()
        );

        var sname = msg["studentName"].toString();
        var sclass =
          msg["studyYear"].toString() + " " + msg["studyGroup"].toString();
        var carplatenumber = message.split("").join(" ");
        var string1 =
          '<speak><s><prosody volume="x-loud"><voice name="Amy">Student name:  ';
        var string2 = '</voice><voice name="Amy">Class: ';
        var string3 =
          '</voice><voice name="Amy">Car plate number:</voice><prosody rate="85%"><voice name="Amy">';
        var string4 =
          '</voice></prosody><voice name="Amy">Your parent is arriving</voice></prosody></s></speak>';
        // sleep for 500ms
        sleep(500);

        client.publish(
          "outTopic",
          string1 +
            sname +
            string2 +
            sclass +
            string3 +
            carplatenumber +
            string4,
          { qos: 0, retain: false },
          (error) => {
            if (error) {
              console.error(error);
            }
          }
        );
      }
    } else {
      console.log(message);
      var detCarPlate = message;
      addToHistory(detCarPlate, 0);
    }
  });
}

function addToHistory(
  detCarPlate,
  isAuthorized,
  detStudentName,
  detStudentClass
) {
  var num = Math.random();
  var detConfidence = num.toFixed(2);
  var detTimestamp = new Date().getTime() / 1000;
  var detImageLink = "";
  var sql1 =
    "INSERT INTO ?? (??,??,??,??,??,??,??,??) VALUES (?,?,?,?,?,?,?,?)";
  var params1 = [
    "dataHistory",
    "deviceId",
    "detTimestamp",
    "detCarPlate",
    "detConfidence",
    "isAuthorized",
    "detStudentName",
    "detStudentClass",
    "detImageLink",
    deviceId,
    detTimestamp,
    detCarPlate,
    detConfidence,
    isAuthorized,
    detStudentName,
    detStudentClass,
    detImageLink,
  ];
  sql1 = mysql.format(sql1, params1);

  connection.query(sql1, function (error, results) {
    if (error) throw error;
    console.log("Message added: " + detCarPlate);
  });
}

//
function callTime(message) {
  var sql3 =
    "SELECT TimesofCall, TimesofCalled FROM plate_count WHERE carPlate = ?";
  var params3 = [message];
  connection.query(sql3, params3, function (err, results, fields) {
    if (err) {
      throw err;
    }
    if (results[0] != null) {
      var msg = results[0];
      console.log(
        "debug",
        msg["TimesofCall"].toString() + msg["TimesofCalled"].toString()
      );
      if (msg["TimesofCall"] > msg["TimesofCalled"]) {
        comparison(message);
        var timesofCalled = msg["TimesofCalled"] + 1;
        var sql4 =
          "UPDATE plate_count SET TimesofCalled = ? WHERE carPlate = ?";
        var params4 = [timesofCalled, message];
        connection.query(sql4, params4, function (err, results, fields) {
          if (err) {
            throw err;
          }
        });
      }
    }
  });
}

function carplateCall() {}
