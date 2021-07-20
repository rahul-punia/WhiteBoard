// server side
const express = require("express");
// express server
const app = express();
//  nodejs
const server = require("http").Server(app);
// nodejs => socket enabled
const path = require("path");
const io = require("socket.io")(server);
// serve static assets to client
app.use(express.static("public"));
// server
io.on("connection", function(socket) {
  socket.on("size", function(size) {
    socket.broadcast.emit("onsize", size);
  });
  socket.on("color", function(color) {
    socket.broadcast.emit("oncolor", color);
  });

  socket.on("toolchange", function(tool) {
    socket.broadcast.emit("ontoolchange", tool);
  });
  socket.on("hamburger", function() {
    socket.broadcast.emit("onhamburger");
  });
  socket.on("mousedown", function(point) {
    socket.broadcast.emit("onmousedown", point);
  });
  socket.on("mousemove", function(point) {
    socket.broadcast.emit("onmousemove", point);
  });
  socket.on("undo", function() {
    socket.broadcast.emit("onundo");
  });
  socket.on("redo", function() {
    socket.broadcast.emit("onredo");
  });
});


const formatMessage = require('./utils/messages');
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers
} = require('./utils/users');

const botName = 'Chat Bot ';

// Run when client connects
io.on('connection', socket => {
  socket.on('joinRoom', ({ username, room }) => {
    const user = userJoin(socket.id, username, room);

    socket.join(user.room);

    // Welcome current user
    socket.emit('message', formatMessage(botName, 'Welcome to Chat Section!'));

    // Broadcast when a user connects
    socket.broadcast
      .to(user.room)
      .emit(
        'message',
        formatMessage(botName, `${user.username} has joined the chat`)
      );

    // Send users and room info
    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getRoomUsers(user.room)
    });
  });

  // Listen for chatMessage
  socket.on('chatMessage', msg => {
    const user = getCurrentUser(socket.id);

    io.to(user.room).emit('message', formatMessage(user.username, msg));
  });

  // Runs when client disconnects
  socket.on('disconnect', () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit(
        'message',
        formatMessage(botName, `${user.username} has left the chat`)
      );

      // Send users and room info
      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room)
      });
    }
  });
});


// nodejs server
const port = process.env.PORT || 3000;
server.listen(port, function(req, res) {
  console.log("Server has started at port 3000");
});