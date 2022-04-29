$(document).ready(function(){
    $('#list').animate({scrollTop: 100000}, 800)
    var socket = io();
    //connect client to server
    socket.on('connect',function(socket){
        console.log('Connected to Server');
    });
    // emit user ID
    var ObjectID = $('#ObjectID').val();
    var carID = $('#carID').val();
    socket.emit('ObjectID',{
        carID:carID,
        userID:ObjectID
    });
    
    //disconnect from server
    socket.on('disconnect',function(socket){
        console.log('Disconnect from server');
    });
});