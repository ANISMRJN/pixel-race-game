const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const path = require("path");

app.use(express.static(path.join(__dirname, "public")));

let players = {};
let gameFinished = false;

io.on("connection", (socket) => {
  socket.on("setNickname", (name) => {
    // Assign a lane based on how many players are already there (0-4)
    const playerCount = Object.keys(players).length;
    
    players[socket.id] = {
      id: socket.id,
      name: name.toUpperCase(),
      x: 0,
      lane: playerCount % 5, // Ensures they stay in separate lanes
      color: ["#ff4d4d", "#4dff4d", "#4db8ff", "#ffff4d", "#ff4dff"][playerCount % 5],
      isWinner: false
    };
    io.emit("update", players);
  });

  socket.on("move", () => {
    if (players[socket.id] && !gameFinished) {
      players[socket.id].x += 10;
      
      if (players[socket.id].x >= 710) {
        players[socket.id].isWinner = true;
        gameFinished = true;
        io.emit("winner", players[socket.id].name);
      }
      // Use volatile.emit for faster updates during mashing
      io.volatile.emit("update", players);
    }
  });

  socket.on("disconnect", () => {
    delete players[socket.id];
    io.emit("update", players);
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server live on ${PORT}`));
