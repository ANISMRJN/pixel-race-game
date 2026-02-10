const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const path = require("path");

// Serve the static files from the 'public' folder
app.use(express.static(path.join(__dirname, "public")));

let players = {};
let gameFinished = false;

io.on("connection", (socket) => {
  console.log("A racer connected:", socket.id);

  // --- JOIN LOGIC ---
  socket.on("setNickname", (name) => {
    const playerCount = Object.keys(players).length;
    
    players[socket.id] = {
      id: socket.id,
      name: name.toUpperCase(),
      x: 0,
      lane: playerCount % 5, // Keeps players in separate tracks (0-4)
      color: ["#ff4d4d", "#4dff4d", "#4db8ff", "#ffff4d", "#ff4dff"][playerCount % 5],
      isWinner: false
    };
    
    // Tell everyone about the new player
    io.emit("update", players);
  });

  // --- MOVEMENT LOGIC ---
  socket.on("move", () => {
    if (players[socket.id] && !gameFinished) {
      players[socket.id].x += 10;
      
      // Check for winner (Finish line at 710px)
      if (players[socket.id].x >= 710) {
        players[socket.id].isWinner = true;
        gameFinished = true;
        io.emit("update", players); // Update one last time to show trophy
        io.emit("winner", players[socket.id].name);
      } else {
        // Use volatile to send updates fast without lagging the server
        io.volatile.emit("update", players);
      }
    }
  });

  // --- RESET LOGIC ---
  socket.on("resetGame", () => {
    console.log("Game being reset by:", socket.id);
    gameFinished = false;
    
    for (let id in players) {
      players[id].x = 0;
      players[id].isWinner = false;
    }
    
    // Send the fresh state to everyone
    io.emit("update", players);
    io.emit("gameReset"); // Clears the "Winner" text and hides Reset button
  });

  // --- DISCONNECT LOGIC ---
  socket.on("disconnect", () => {
    console.log("A racer left:", socket.id);
    delete players[socket.id];
    io.emit("update", players);
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Server live on port ${PORT}`);
});
