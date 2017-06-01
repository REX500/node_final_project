var socket = io.connect("http://localhost:500");

// when page is opened it makes a call to the db to retrive all leasure bikes etc.

socket.emit("retrive_leasure", {"message":"retrive_leasure"});

var test = {};

// getting bikes back from the database
socket.on("leasure_bikes_from_db", function(jData){
  // putting all of the leasure bikes into a dynamically allocated div's
    console.log(jData.length);
    test = jData;
    for(let i = 0 ; i < jData.length; i++){
      var link = "leasureBike";
      var url = "leasureBike/"+jData[i].modelName;
      console.log(url);
      $("#leasureBikesDiv").append("<a href="+url+"><h1 id="+jData[i].modelName+" >"+jData[i].modelName+"</h1></a>");
    }
});

// displaying a certain bike when clicked on
$(function() {
$(document).on("click", 'a', function(event) {
  // using function and then 'on' instead of 'click' cause 'click' only works for
  // elements written in the original html doc not the ones dynamically added

  var clickedBike = event.target.id;
  // cross matching a chosen bike with the one in the database
  // for(let i = 0 ; i < test.length; i++){
  //   if(test[i].modelName == clickedBike){
  //     console.log("The bike exists in the data base and is: "+clickedBike);
  //     populateLeasureBikeLabels(test[i]);
  //     break;
  //   }
  //   else {
  //     console.log("The bike doesnt exist in the database");
  //   }
  // }
console.log(clickedBike);
  // making a ajax call to the server
			var sUrl = "leasureBike/"+clickedBike;
			//   $.get( sUrl , function( jData ){
			//  	console.log("Bike has been sent successfuly");
			//  });
      $.ajax({
         "url":sUrl,
         "method":"GET"
       });
      //  }).done(function(sData){
      //    $("body").append(sData);
      //  }); // doesnt work properly, html doesnt get sent to the client
  });

});

function populateLeasureBikeLabels(bikeArray){
  // console.log("Hi from the method: "+bikeArray.modelName);

  // populating the site with the bike info
  $("#modelNameLabel").append("jajaj");
}
