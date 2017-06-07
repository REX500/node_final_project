// making a server
var express = require("express"), redirect = require("express-redirect");
var app = express();
redirect(app);

// creating a socket server
var server = require("http").Server(app);
var io = require("socket.io")(server);

// use the file system - fs comes with node, no need to install it
var fs = require("fs");

// enabling the input from the console
var readline = require('readline');

// database connection
var mongo = require("mongodb").MongoClient;
var sPath = "mongodb://localhost:27017/cervelo";

// enabling the usage of public files
app.use(express.static(__dirname+'/public'));

/*******************************************************/
/*******************************************************/
/*******************************************************/
/*******************************************************/
/*******************************************************/

// calling global methods //

getLeasureBikes();
getMtbBikes();
getRoadBikes();

// global variables //

let globalJsonLeasureBikes= [];
let globalJsonMtbBikes = [];
let globalJsonRoadBikes = [];

io.on("connection", function(oSocket){
  // on is used to receive the message
  // emit is used to send the message

  oSocket.on("customer_chat", function(jData){
    // jData is a json object that contains the message from the client
    var sMessage = jData.message;
    console.log(sMessage);
    /************ sends the response back to the client *************/
    oSocket.broadcast.emit("server_response", {"message":sMessage});
  });

  oSocket.on("customer_log_in", function(jData){
    var username = jData.username;
    var password = jData.password;

    // checking if the username and password exists in the database
    mongo.connect(sPath, function(err, oDb){
      var employee = oDb.collection("employee");
      // checking if mongo can fetch the employee
      employee.find({"username":username, "password":password}).toArray(function(err, ajEmployee){
        if(err){
          console.log("Employee doesnt exist");
        }
        // console.log(ajEmployee[0].name);
        else /*(username==ajEmployee[0].username && password==ajEmployee[0].password)*/{
          console.log("they match");
          // employee exists so now we can call a function that presents a employee with a chat view
            oSocket.emit("login_response", {"message":"success"});
        }
      });
    });
  });

  /****************** retriving bikes from the database ***********************/
   oSocket.on("get_all_bikes", function(jData){
     // sends back all the bike categories that exist in the webshop
     mongo.connect(sPath, function(err, oDb){
       if(err) throw err;
       oDb.listCollections().toArray(function(err, collections){
        //  console.log(collections[0].name+collections[1].name);
        //  console.log("The database has:"+collections.length+" collections");
        // putting collections into a var
        // for(let i = 1 ; i < collections.length; i++){
        //   var object = "name"
        // }
        oSocket.emit("returning_bike_types", collections);
       });
     });
   });

   /************ retriving leasure bikes from the database ********************/

   oSocket.on("retrive_leasure", function(jData){
      oSocket.emit("leasure_bikes_from_db", globalJsonLeasureBikes);
   });

   /************ retriving mtb bikes from the database ********************/

   oSocket.on("retrive_mtb", function(jData){
     oSocket.emit("mtb_bikes_from_db", globalJsonMtbBikes);
   });

   /************ retriving road bikes from the database ********************/

   oSocket.on("retrive_road", function(jData){
     oSocket.emit("road_bikes_from_db", globalJsonRoadBikes);
   });

  //  end of sockets //
});


/*************** sending a html file to a client *********************/
app.get("/", function(req, res){
  res.sendFile(__dirname+"/gui/index.html");
});

app.get("/customer_log_in", function(req, res){
  res.sendFile(__dirname+"/gui/customer_log_in.html")
});

// making a gui for the customer for the customer_chat
app.get("/customer_chat", function(req, res){
  res.sendFile(__dirname+"/gui/customer_chat.html");
});

// leasure bikes
app.get("/leasureBikeSite", function(req, res){
  res.sendFile(__dirname+"/gui/leasureBikeSite.html");
});

// mtb bikes
app.get("/mtbBikeSite", function(req, res){
  res.sendFile(__dirname+"/gui/mtbBikeSite.html");
});

// road bikes
app.get("/roadBikeSite", function(req, res){
  res.sendFile(__dirname+"/gui/roadBikeSite.html");
});

// displaying a leasure bike
app.get("/leasureBike/:modelName", function(req, res){

  var modelName = req.params.modelName;
  console.log("Href method works --> "+modelName);

  // based on the chosen model we populate the following html page
  fs.readFile(__dirname+"/gui/leasureBike.html" , "utf8", function(err, sData){

    // console.log("The page is this: "+sData);
    let correctIndex;
    for(let i = 0; i < globalJsonLeasureBikes.length ; i++){
      // finding the clicked bike now
      if(modelName == globalJsonLeasureBikes[i].modelName){
        console.log("Name matches: "+globalJsonLeasureBikes[i].modelName);
        correctIndex = i;
        break;
      }
    }

    console.log("Right index is: "+correctIndex);

    // replacing the placeholders in the html file heck yea
    sData = sData.replace("{{bike-name}}", globalJsonLeasureBikes[correctIndex].modelName);
    sData = sData.replace("{{bike-weight}}", globalJsonLeasureBikes[correctIndex].weight);
    sData = sData.replace("{{bike-drivetrain}}", globalJsonLeasureBikes[correctIndex].drivetrain);
    sData = sData.replace("{{bike-wheels}}", globalJsonLeasureBikes[correctIndex].wheels);
    sData = sData.replace("{{bike-tyres}}", globalJsonLeasureBikes[correctIndex].tyres);

    res.send(sData);
  });
});

// displaying a mtb bike-tyres

app.get("/mtbBike/:modelName", function(req, res){
  var modelName = req.params.modelName;

  console.log("Href method works --> "+modelName);

  // based on the chosen model we populate the following html page
  fs.readFile(__dirname+"/gui/mtbBike.html" , "utf8", function(err, sData){

    // console.log("The page is this: "+sData);
    let correctIndex;
    for(let i = 0; i < globalJsonMtbBikes.length ; i++){
      // finding the clicked bike now
      if(modelName == globalJsonMtbBikes[i].modelName){
        console.log("Name matches: "+globalJsonMtbBikes[i].modelName);
        correctIndex = i;
        break;
      }
    }

    console.log("Right index is: "+correctIndex);

    // replacing the placeholders in the html file heck yea
    sData = sData.replace("{{bike-name}}", globalJsonMtbBikes[correctIndex].modelName);
    sData = sData.replace("{{bike-weight}}", globalJsonMtbBikes[correctIndex].weight);
    sData = sData.replace("{{bike-drivetrain}}", globalJsonMtbBikes[correctIndex].drivetrain);
    sData = sData.replace("{{bike-wheels}}", globalJsonMtbBikes[correctIndex].wheels);
    sData = sData.replace("{{bike-tyres}}", globalJsonMtbBikes[correctIndex].tyres);

    res.send(sData);
  });
});

// displaying a certain road bike
app.get("/roadBike/:modelName", function(req, res){
  var modelName = req.params.modelName;

  console.log("Href method works --> "+modelName);

  // based on the chosen model we populate the following html page
  fs.readFile(__dirname+"/gui/roadBike.html" , "utf8", function(err, sData){

    // console.log("The page is this: "+sData);
    let correctIndex;
    for(let i = 0; i < globalJsonRoadBikes.length ; i++){
      // finding the clicked bike now
      if(modelName == globalJsonRoadBikes[i].modelName){
        console.log("Name matches: "+globalJsonRoadBikes[i].modelName);
        correctIndex = i;
        break;
      }
    }

    console.log("Right index is: "+correctIndex);

    // replacing the placeholders in the html file heck yea
    sData = sData.replace("{{bike-name}}", globalJsonRoadBikes[correctIndex].name);
    sData = sData.replace("{{bike-model}}", globalJsonRoadBikes[correctIndex].modelName);
    sData = sData.replace("{{bike-type}}", globalJsonRoadBikes[correctIndex].type);
    sData = sData.replace("{{bike-color}}", globalJsonRoadBikes[correctIndex].color);
    sData = sData.replace("{{bike-weight}}", globalJsonRoadBikes[correctIndex].weight);
    sData = sData.replace("{{bike-groupset}}", globalJsonRoadBikes[correctIndex].groupset);
    sData = sData.replace("{{bike-saddle}}", globalJsonRoadBikes[correctIndex].saddle);
    sData = sData.replace("{{bike-wheels}}", globalJsonRoadBikes[correctIndex].wheels);
    sData = sData.replace("{{bike-tyres}}", globalJsonRoadBikes[correctIndex].tyres);
    sData = sData.replace("{{bike-brakes}}", globalJsonRoadBikes[correctIndex].brakes);
    sData = sData.replace("{{bike-price}}", globalJsonRoadBikes[correctIndex].price);

    res.send(sData);
  });
});

app.get("/leasureBike", function(req, res){
  res.sendFile(__dirname+"/gui/leasureBike.html");
});

// starting server and sockets on this port
server.listen(500, function(err){
  if(err){
    console.log("error");
  }
  console.log("server is running");
});


/********************************************************/
/********************************************************/
/********************************************************/
/********************************************************/
/********************************************************/

//   methods that retrive the data from the database fuck yea //

// leasure bikes retrival

function getLeasureBikes(){
  console.log("getLeasureBikes function is called....");
  mongo.connect(sPath, function(err, oDb){
    if(err) throw err;
    // read the data from the collection
    var leasureBikes = oDb.collection("leasure");
    console.log("Retriving the bikes....");
    // listing all bikes that are under leasure collection
    leasureBikes.find({"name":"leasure"}).toArray(function(err, ajBikes){
     //  console.log(ajBikes);
     // putting the bikes into a global array
     globalJsonLeasureBikes = ajBikes;
     console.log("Bikes are now in the globalJsonLeasureBikes array");
    });
  });
}


// mountain bike retrival

function getMtbBikes(){
  console.log("getMtbBikes function is called....");
  mongo.connect(sPath, function(err, oDb){
    if(err) throw err;
    // read the data from the collection
    var mtbBikes = oDb.collection("mtb");
    console.log("Retriving the bikes....");
    // listing all bikes that are under mtb collection
    mtbBikes.find({"name":"mtb"}).toArray(function(err, ajBikes){
      // console.log(ajBikes);
     // putting the bikes into a global array
     globalJsonMtbBikes = ajBikes;
     console.log("Bikes are now in the globalJsonMtbBikes array");
    });
  });
}

// road bike retrival

function getRoadBikes(){
  console.log("getRoadBikes function is called....");
  mongo.connect(sPath, function(err, oDb){
    if(err) throw err;
    // read the data from the collection
    var roadBikes = oDb.collection("road");
    console.log("Retriving the bikes....");
    // listing all bikes that are under road collection
    roadBikes.find({"name":"road"}).toArray(function(err, ajBikes){
      // console.log("road bikes: "+ajBikes);
     // putting the bikes into a global array
     globalJsonRoadBikes = ajBikes;
     console.log("Bikes are now in the globalJsonRoadBikes array");
    });
  });
}
