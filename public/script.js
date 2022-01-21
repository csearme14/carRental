$(document).ready(function(){
    var socket = io();
    //connect client to server
    socket.on('connect',function(socket){
        console.log('Connected to Server');
    });
    //disconnect from server
    socket.on('disconnect',function(socket){
        console.log('Disconnect from server');
    });
});