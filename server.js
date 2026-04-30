const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

let lobby = {}; // username -> socket.id

io.on("connection", socket => {

  socket.on("joinLobby", username => {

    socket.username = username;

    // 🔥 aynı kullanıcı varsa güncelle (reconnect)
    lobby[username] = socket.id;

    console.log("Lobby:", Object.keys(lobby));

    // herkese gönder
    io.emit("lobby", Object.keys(lobby));

    // 🚀 OYUN BAŞLAT
if (Object.keys(lobby).length >= 4) {

  const currentLobby = { ...lobby }; // 🔥 KRİTİK

  const players = Object.keys(currentLobby);

  console.log("OYUN BAŞLIYOR:", players);

  const sockets = players.map(name =>
    io.sockets.sockets.get(currentLobby[name])
  );

  startGame(sockets, players);

  lobby = {};
    }
  });

  socket.on("disconnect", () => {
    if (!socket.username) return;

    delete lobby[socket.username];

    io.emit("lobby", Object.keys(lobby));

    console.log("Çıktı:", socket.username);
  });
});


function startGame(sockets, players) {

  const deck = createDeck();

  const table = deck.splice(0, 4);

  sockets.forEach(s => {
    if (!s) return;
    s.hand = deck.splice(0, 4);
  });

  sockets.forEach(s => {
    if (!s) return;

    s.emit("gameData", {
      hand: s.hand,
      table
    });
  });

  io.emit("startGame", players);
}


// 🃏 DESTE
function createDeck() {
  const suits = ["♠", "♥", "♦", "♣"];
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
