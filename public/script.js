// script for the index hmtl page that deals with the
// communication with the server
console.log("it works");

 var socket = io.connect("http://localhost:500");

// // using jQuery to send a message to the server
$("#btnSend").click(function(){
  // geting whatever user inputed
  var sMessage = $("#chatInput").val();
  $("#chat_window").append("<li>"+"You: "+sMessage+"</li>");
  $("#chatInput").val('');
  // console.log(sMessage);
  socket.emit("customer_chat", {"message":sMessage});
});

socket.on("server_response", function(jData){
  var sMessage = jData.message;
  console.log(sMessage);
  $("#chat_window").append("<li>"+"Employee: "+sMessage+"</li>");
});


// getting all bikes when clicked on a button
// later it will appear when the user clicks 'bikes' on the navbar
// to display all bike types
$("#get_all_bikes").click(function(){
  socket.emit("get_all_bikes", {});
});

// getting all bike types from the server
socket.on("returning_bike_types", function(jData){
  console.log(jData[1].name);
  $("#get_all_bikes").hide();
  $("#bike-div").show();
  for(let i = 1; i < jData.length; i++){
    var extension = "AnchorElement";
      $("#bike-div").append("<a id="+jData[i].name+extension+"><h1>"+jData[i].name+"</h1></a>"+"<br>");
  }
});

// buying a bike
$("#leasureAnchorElement").click(function(){
  console.log("Clicked on leasure element");
});
