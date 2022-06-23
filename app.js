//require the express module
const express = require("express");
const app = express();
//require the http module
const http = require("http").Server(app);
const io = require("socket.io")(http);
const chatRouter = require("./route/chatroute");

const port = 5000;

// middleware
app.use(express.json());

//routes
app.use("/chats", chatRouter);

//set the express.static middleware
app.use(express.static(__dirname + "/public"));

//database connection
const Chat = require("./models/Chat");
const connect = require("./dbconnect");

//setup event listener
io.sockets.on("connection", (socket) => {
  console.log("user connected");

  socket.on("disconnect", function () {
    console.log("user disconnected");
  });

  //Someone is typing
  socket.on("typing", data => {
    socket.broadcast.emit("notifyTyping", {
      user: data.user,
      message: data.message
    });
  });

  //when soemone stops typing
  socket.on("stopTyping", () => {
    socket.broadcast.emit("notifyStopTyping");
  });

  socket.on("chat message", function (msg) {
    console.log("message: " + msg);

    //broadcast message to everyone in port:5000 except yourself.
    socket.broadcast.emit("received", { message: msg });

    //save chat to the database
    connect.then(db => {
      console.log("connected to the server correctly");
      let chatMessage = new Chat({ message: msg, sender: "Anonymous" });

      chatMessage.save();
    });
  });
});

http.listen(port, () => {
  console.log("Running on Port: " + port);
});
