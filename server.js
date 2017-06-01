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

    // checking if the username and password exist in the database
    mongo.connect(sPath, function(err, oDb){
      var employee = oDb.collection("employee");
      // checking if mongo can fetch the employee
      employee.find({"username":username, "password":password}).toArray(function(err, ajEmployee){
        if(err){
          console.log("Employee doesnt exist");
        }
        // console.log(ajEmployee[0].name);
        if(username==ajEmployee[0].username && password==ajEmployee[0].password){
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
     // calling all leasure bikes from the database
     mongo.connect(sPath, function(err, oDb){
       if(err) throw err;
       // read the data from the collection
       var leasureBikes = oDb.collection("leasure");

       // listing all bikes that are under leasure collection
       leasureBikes.find({"name":"leasure"}).toArray(function(err, ajBikes){
        //  console.log(ajBikes);
        oSocket.emit("leasure_bikes_from_db", ajBikes);
       });
     });
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

// leasure bike
app.get("/leasureBike/:modelName", function(req, res){
  var modelName = req.params.modelName;
  console.log("Ajax method works --> "+modelName);

  // based on the chosen model we populate the following html page
  fs.readFile(__dirname+"/gui/leasureBike.html" , "utf8", function(err, sData){

    console.log("The page is this: "+sData);
    var result = sData.replace("{{model-name}}", modelName);

    fs.writeFile(__dirname+"/gui/leasureBike.html", result, "utf8", function(err){
      if(err) return console.log(err);
      res.send(sData);
    });
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
