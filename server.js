const express = require('express');
const app = express();
let http = require('http').Server(app);

const port = process.env.PORT || 3000;

let io = require('socket.io')(http);

// app.use(express.static('public'))

http.listen(port, ()=>{
    console.log('listening on ', port);  
});


io.on('connection', socket=>{
    console.log('a user connected to socket');
    socket.on('joinTheRoom', room=>{
        console.log('create or join to room', room);
        const myRoom = io.sockets.adapter.rooms[room] || {length:0};
        const numClients = myRoom.length;
        console.log(room, 'has', numClients,'clients');
        
        if(numClients == 0 ){
            socket.join(room);
            socket.emit('roomCreated', room);
        }else if(numClients > 0){
            socket.join(room);
            socket.emit('roomJoined', room);
        }else {
            socket.emit('full', room);
        }
    });

    socket.on('ready', room=>{
        console.log('ready');
        
        socket.broadcast.to(room).emit('ready');
    });


    socket.on('candidateLocal', event=>{
        console.log('candidateLocal');
        socket.broadcast.to(event.room).emit('candidateLocal', event);
    });


    socket.on('candidateRemote', event=>{
        console.log('candidateRemote');
        socket.broadcast.to(event.room).emit('candidateRemote', event);
    });


 

    socket.on('offer',event=>{
        console.log('offer');
        socket.broadcast.to(event.room).emit('offer', event.sdp);
    });

    socket.on('answer', event=>{
        console.log('answer');
        socket.broadcast.to(event.room).emit('answer', event.sdp);
    });

   
})

