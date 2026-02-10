const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const path = require("path");

app.use(express.static(path.join(__dirname, "public")));

let players = {};
let gameFinished = false;

io.on("connection", (socket) => {
  // Join Logic
  socket.on("setNickname", (name) => {
    const playerCount = Object.keys(players).length;
    players[socket.id] = {
      id: socket.id,
      name: name.toUpperCase(),
      x: 0,
      lane: playerCount % 5, 
      color: ["#ff4d4d", "#4dff4d", "#4db8ff", "#ffff4d", "#ff4dff"][playerCount % 5],
      isWinner: false
    };
    io.emit("update", players);
  });

  // Movement Logic
  socket.on("move", () => {
    if (players[socket.id] && !gameFinished) {
      players[socket.id].x += 10;
      if (players[socket.id].x >= 710) {
        players[socket.id].isWinner = true;
        gameFinished = true;
        io.emit("update", players);
        io.emit("winner", players[socket.id].name);
      } else {
        io.volatile.emit("update", players);
      }
    }
  });

  // COUNTDOWN RESET LOGIC
  socket.on("resetGame", () => {
    if (gameFinished) {
      let count = 3;
      const timer = setInterval(() => {
        if (count > 0) {
          io.emit("countdown", count);
          count--;
        } else {
          clearInterval(timer);
          gameFinished = false;
          // Reset all players to start line
          for (let id in players) {
            players[id].x = 0;
            players[id].isWinner = false;
          }
          io.emit("update", players);
          io.emit("gameReset"); 
        }
      }, 1000);
    }
  });

  socket.on("disconnect", () => {
    delete players[socket.id];
    io.emit("update", players);
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server live on ${PORT}`));
