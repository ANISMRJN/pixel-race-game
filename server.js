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
    players[socket.id] = {
      id: socket.id,
      name: name,
      x: 0,
      index: Object.keys(players).length,
      color: ["#ff4d4d", "#4dff4d", "#4db8ff", "#ffff4d", "#ff4dff"][Object.keys(players).length % 5],
      isWinner: false
    };
    io.emit("update", players);
  });

  socket.on("move", () => {
    if (players[socket.id] && !gameFinished) {
      players[socket.id].x += 12;
      if (players[socket.id].x >= 710) {
        players[socket.id].isWinner = true;
        gameFinished = true;
      }
      io.emit("update", players);
    }
  });

  socket.on("disconnect", () => {
    delete players[socket.id];
    io.emit("update", players);
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server running on port ${PORT}`));
