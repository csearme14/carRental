$(document).ready(function(){
    var socket = io();
    //connect client to server
    socket.on('connect',function(socket){
        console.log('Connected to Server');
    });
    // emit user ID
    var ObjectID = $('#ObjectID').val();
    socket.emit('ObjectID',ObjectID);
    //listen to car event
    socket.on('car',function(car){
        console.log(car);
            //make an ajax request to fetch latitude and longitude
            $.ajax({
                url:`https://maps.googleapis.com/maps/api/geocode/json?address=${car.location}&key=AIzaSyBMBKCUVBeA74u7ZgxAgimeJpF2oPeTdFw`,
               type:'POST',
               data: JSON,
               processData:true,
               success:function(data){
                   console.log(data);
                   //send lat and lng to server
                   socket.emit('LatLng',{
                       data: data,
                       car:car
                   });
               }
            });
    });
    //disconnect from server
    socket.on('disconnect',function(socket){
        console.log('Disconnect from server');
    });
});