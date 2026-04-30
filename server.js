const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

// 🔥 username -> socket
let users = {};

io.on("connection", socket => {

  socket.on("joinLobby", username => {

    socket.username = username;

    // kullanıcıyı kaydet
    users[username] = socket;

    console.log("Lobby:", Object.keys(users));

    io.emit("lobby", Object.keys(users));

    // 🎮 OYUN BAŞLAT
    if (Object.keys(users).length >= 4) {

      const players = Object.keys(users);
      const sockets = players.map(name => users[name]);

      console.log("OYUN BAŞLIYOR:", players);

      startGame(sockets, players);

      users = {}; // reset
    }
  });

  socket.on("disconnect", () => {
    if (!socket.username) return;

    delete users[socket.username];

    io.emit("lobby", Object.keys(users));

    console.log("Çıktı:", socket.username);
  });
});


// 🎮 OYUN
function startGame(sockets, players) {

  const deck = createDeck();

  const table = deck.splice(0, 4);

  sockets.forEach(s => {
    s.hand = deck.splice(0, 4);
  });

  // 🔥 ÖNCE gameData
  sockets.forEach(s => {
    s.emit("gameData", {
      hand: s.hand,
      table
    });
  });

  // 🔥 SONRA startGame
  io.emit("startGame", players);
}


// 🃏 DESTE
function createDeck() {
  const suits = ["♠","♥","♦","♣"];
  const values = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];

  let deck = [];

  for (let s of suits) {
    for (let v of values) {
      deck.push(v + s);
    }
  }

  return deck.sort(() => Math.random() - 0.5);
}

server.listen(3000, () => console.log("SERVER READY"));
