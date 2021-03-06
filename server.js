// making a server
var express = require("express"), redirect = require("express-redirect");
var app = express();
redirect(app);
// ability to use sessions for the users who log-in
var session = require('express-session');
app.use(session({secret:"32dawd3ecdwxder23fec3", resave: false, saveUninitialized: true}));
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

// using ipware
var getIP = require('ipware')().get_ip;

// enabling the usage of public files
app.use(express.static(__dirname+'/public'));

/******************** Making a chat system smart *********************/

// using other js files
var employeeObject = require(__dirname+"/employeeObject.js");
// array that will store all of the current employees
var aEmployees = [];
let employeeLogedIn = false;
let employeeCount = aEmployees.length;



/*******************************************************/
/*******************************************************/
/*******************************************************/
/*******************************************************/
/*******************************************************/

// global variables //

let globalJsonLeasureBikes= [];
let globalJsonMtbBikes = [];
let globalJsonRoadBikes = [];
let globalJsonCustomers = [];
let globalJsonOneCustomer = [];
let currentCustomersArray = [];
let globalJsonEmployee = [];
var chosenBikeArray="";
let logInCheck = false;
let beenHereBefore = false;

// calling global methods //

getLeasureBikes();
getMtbBikes();
getRoadBikes();
getAllCustomers();
getEmployee();

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

  oSocket.on("employee_log_in", function(jData){
    var username = jData.username;
    var password = jData.password;

    // check if the employee exists
    for (var i = 0; i < globalJsonEmployee.length; i++) {
      if(globalJsonEmployee[i].username == username && globalJsonEmployee[i].password == password){
        console.log("Employee has been authorized, sending socket response back to the server");
        oSocket.emit("login_response", {"message":"sucess"});
        // employee chat system logic
        employeeLogedIn = true;
        aEmployees.push(employeeObject.fnCreateEmployee(globalJsonEmployee[i].firstName, "online"));
        console.log("employee object pushed into an array "+aEmployees+" / and boolean var set to "+employeeLogedIn);
        break;
      }else {
        console.log("Empoyee cannot be authorized, waiting for the user to try again...");
        oSocket.emit("login_response", {"message":"failure"});
      }
    }
  });

  /********** more employee logic here, checking if he is available ************/
  oSocket.on("employee_available", function(jData){
    // check if the employee is available
    if(employeeLogedIn && aEmployees.length!=0){
      // means that the employee is online and the chat can begin buhahaha
      console.log("client tried to initiate the chat, result is good, employee available");
      console.log("employee name  "+aEmployees[0].name);
      for (var i = 0; i < aEmployees.length; i++) {
        if(aEmployees[i].status == "online"){
          oSocket.emit("chat-initiated", {"message":"sucess","name":aEmployees[i].name});
          aEmployees[i].status = "busy";
          console.log(aEmployees[i].status);
        }
        else{
          console.log("No free employees found");
          oSocket.emit("chat-initiated", {"message":"failure", "reason":"No free employees found"});
        }
      }
    }
    else{
      oSocket.emit("chat-initiated", {"message":"failure", "reason":"No employees online"});
    }
  });

  /******************** employee log out **********************/
oSocket.on("employee-log-out", function(jData){
  console.log("socket recieved");
  for (var i = 0; i < globalJsonEmployee.length; i++) {
    if(globalJsonEmployee[i].username == jData.username){
      console.log("Found the match, its a "+i+". employee");
        for (var j = 0; j < aEmployees.length; j++) {
          if(aEmployees[j].name == globalJsonEmployee[i].firstName){
            console.log("Names match!!");
            aEmployees.splice(j,1);
            console.log("array length is now: "+aEmployees.length);
          }
        }
    }
  }
});

  /****************** retriving bikes from the database ***********************/
   oSocket.on("get_all_bikes", function(jData){
     // sends back all the bike categories that exist in the webshop
     mongo.connect(sPath, function(err, oDb){
       if(err) throw err;
       oDb.listCollections().toArray(function(err, collections){
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

   oSocket.on("register-new-user", function(jData){
     console.log("Socket recieved!!");
     console.log("mail is: "+jData.email);
     registerNewUser(jData.firstname,
                     jData.lastname,
                     jData.nationality,
                     jData.email,
                     jData.password,
                     jData.phone,
                     jData.address);
     oSocket.emit("new-user-registration", {"message": "sucess"});
     // calling the method again so that the list refreshes
     getAllCustomers();
   });

   oSocket.on("user-login", function(jData){
     console.log("email is: "+jData.email+" and pass: "+jData.password);
     // calling a method that will authenticate the entered data
     var result = checkCustomer(jData);
     console.log("result is: "+result);
     if(result == "sucess"){
       oSocket.emit("user-login", {"message":result});
       // we send the result back and then start the timer that lasts 1 second
       // in which the browser can log in to the given link
       // when the second passes user cannot longer log in with the same link
       logInCheck = true;
       beenHereBefore = true;
       setTimeout(function (){
         logInCheck = false;
         console.log("set to false");
       }, 200);
     }
     else{
       oSocket.emit("user-login", {"message":result});
     }
   });

   oSocket.on("get_customer_data", function(jData){
     let email = jData.email;
     let password = jData.password;
     let correctIndex = 0;

     for (var i = 0; i < globalJsonCustomers.length; i++) {
       if(globalJsonCustomers[i].email == email && globalJsonCustomers[i].password == password){
         console.log("email and password match!!");
         correctIndex = i;
         break;
       }
     }

     oSocket.emit("here_is_the_customers_data", {"firstName":globalJsonCustomers[correctIndex].firstName, "otherNames":globalJsonCustomers[correctIndex].otherNames, "address":globalJsonCustomers[correctIndex].fullAddress,"phoneNumber":globalJsonCustomers[correctIndex].phoneNumber,"email":globalJsonCustomers[correctIndex].email});
   });

  //  end of sockets //
});


/*************** sending a html file to a client *********************/
app.get("/", function(req, res){
  beenHereBefore = false;
  res.sendFile(__dirname+"/gui/index.html");
});

// employee chat i am alive message
app.get("/shutItDown/:employee", function(req, res){
  console.log("Shutting it down");
  let name = req.params.employee;

  for (var i = 0; i < aEmployees.length; i++) {
    if(aEmployees[i].name == name){
      aEmployees[i].status = "online";
    }
  }
});

app.get("/logInSessionTest/:email/:password", function(req, res){
  let email = req.params.email;
  let password = req.params.password;

  console.log("Ajax works, this is the data --> "+email+"  "+password);

    req.session.email = email;
    req.session.password = password;
});

app.get("/employee_log_in", function(req, res){
  beenHereBefore = false;
  res.sendFile(__dirname+"/gui/employee_log_in.html")
});

app.get("/roadBike/customerLogin/:chosenBike", function(req, res){
  beenHereBefore = false;
  // bike that customer has choosen, will be saved for later use when
  // he logs in or makes an account
  let chosenBike = req.params.chosenBike;
  console.log(chosenBike);
  chosenBikeArray = chosenBike;
  res.sendFile(__dirname+"/gui/logInScreen.html");
});

app.get("/customerLogin", function(req, res){
  beenHereBefore = false;
  res.sendFile(__dirname+"/gui/logInScreen.html");
});

// making a gui for the customer for the customer_chat
app.get("/customer_chat", function(req, res){
  beenHereBefore = false;
  res.sendFile(__dirname+"/gui/customer_chat.html");
});

// leasure bikes
app.get("/leasureBikeSite", function(req, res){
  beenHereBefore = false;
  res.sendFile(__dirname+"/gui/leasureBikeSite.html");
});

// mtb bikes
app.get("/mtbBikeSite", function(req, res){
  beenHereBefore = false;
  res.sendFile(__dirname+"/gui/mtbBikeSite.html");
});

// road bikes
app.get("/roadBikeSite", function(req, res){
  beenHereBefore = false;
  res.sendFile(__dirname+"/gui/roadBikeSite.html");
});

// frame geometry
app.get("/geometry", function(req, res){
  beenHereBefore = false;
  res.sendFile(__dirname+"/gui/geometry.html");
});

// customer page
app.get("/customerPage/:email", function(req, res){

  if(logInCheck && beenHereBefore){
    beenHereBefore = true;
    // here we have to fulfill the page with the credentials of the user
    let email = req.params.email;
    //finding the user with the right email
    fs.readFile(__dirname+"/gui/customerPage.html", "utf8", function(err, sData){
      let correctIndex;

      for (var i = 0; i < globalJsonCustomers.length; i++) {
        if(globalJsonCustomers[i].email == email){
          correctIndex = i;
        }
      }

        sData = sData.replace("{{first-name}}", globalJsonCustomers[correctIndex].firstName);
        sData = sData.replace("{{other-names}}", globalJsonCustomers[correctIndex].otherNames);
        sData = sData.replace("{{email}}", globalJsonCustomers[correctIndex].email);
        sData = sData.replace("{{password}}", globalJsonCustomers[correctIndex].password);
        sData = sData.replace("{{phone-number}}", globalJsonCustomers[correctIndex].phoneNumber);
        let selectedBike= "";
        if(chosenBikeArray == ""){
          selectedBike = "Your shopping cart is empty!";
        }
        else {
          selectedBike = "You currently have one item in your cart: "+chosenBikeArray;
        }

        sData = sData.replace("{{chart-section}}", selectedBike);
        res.send(sData);
    });
    var ipInfo = getIP(req);
    console.log(ipInfo.clientIp);
    currentCustomers(email, ipInfo.clientIp);

    // res.send("Sup fuckaaaaa   ---> "+email+" ur IP is: "+ipInfo.clientIp);
  }
  else {
    res.send("Acess denied");
  }
});

// displaying a leasure bike
app.get("/leasureBike/:modelName", function(req, res){
  beenHereBefore = false;
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
  beenHereBefore = false;
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
  beenHereBefore = false;
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
  beenHereBefore = false;
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


function getEmployee(){
  console.log("getEmployee function is called....");
  mongo.connect(sPath, function(err, oDb){
    var employee = oDb.collection("employee");
    console.log("Retriving the employees....");
    // checking if mongo can fetch the employee
    employee.find({"name":"employee"}).toArray(function(err, ajEmployee){
      if(err) throw err;
      else{
        globalJsonEmployee = ajEmployee;
        console.log("Retrived all employees from the database...");
      }
    });
  });
}

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
     console.log("road bikes: "+ajBikes);
     console.log("Bikes are now in the globalJsonRoadBikes array");
    });
  });
}

// methods that write to the database

// register a new user
function registerNewUser(fname, lname, nationality, email, password, phone, address){
  console.log("Adding a new user to the database");
  mongo.connect(sPath, function(err, oDb){
    if(err) throw err;
    var customers = oDb.collection("customer");
    customers.insert({"name":"customer","firstName": fname, "otherNames": lname, "nationality": nationality, "email": email, "password": password, "phoneNumber": phone,"fullAddress":address, "additionalStreetInfo":"blank", "chart":"empty", "numberOfPurchases":"0", "grade":"5" }, function(err, uData){
      console.log(uData);
      console.log("User registered succesfully!");
    });
  });
}

// get all customers back
function getAllCustomers(){
  console.log("Getting all customers!");
  mongo.connect(sPath, function(err, oDb){
    if(err) throw err;
    var customers = oDb.collection("customer");
    customers.find({"name":"customer"}).toArray(function(err, ajCustomers){
      // putting the customers into the array
      globalJsonCustomers = ajCustomers;
      console.log("Customers are now in the globalJsonCustomers array");
    });
  });
}

// check if the customer exists
function checkCustomer(jData){
  var result;
  // console.log(globalJsonCustomers[1].email);
  for(let i = 0; i < globalJsonCustomers.length; i++){
    console.log("For loop started");
    console.log(globalJsonCustomers[i].email);
    if(globalJsonCustomers[i].email == jData.email && globalJsonCustomers[i].password == jData.password){
      console.log("Customer found, he's name is: "+jData.email);
      result = "sucess";
      break;
    }
    else if(globalJsonCustomers.length - i == 1){
      result = "failure";
    }
    else {
      console.log("Customer couldnt be found");
    }
  }
  console.log("function result is: "+result);
  return result;
}

// all of the local users

function currentCustomers(email, ipAddress){
  currentCustomersArray.push({email, ipAddress});
}

// getting the info of an special customer
function getCustomerInfo(email, password){
  console.log("his email: "+email+" his password: "+password);
  mongo.connect(sPath, function(err, oDb){
    if(err) throw err;
    // read the data from the collection
    var customer = oDb.collection("customer");
    console.log("Retriving the customers info....");
    // getting customers information
    customer.find({"name":"customer", "email":email, "password":password}).toArray(function(err, ajCustomer){
      globalJsonOneCustomer = ajCustomer;
      console.log("retrived the customer: "+ajCustomer[0].email);
    });
  });
}
