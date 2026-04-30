const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");

const app = express();
const server = http.createServer(app);

const io = new Server(server, { cors: { origin: "*" } });

app.use(express.json());
app.use(express.static("public"));

const ADMIN_USER = "ersin901";
const ADMIN_PASS = "ersin9011";

let users = fs.existsSync("users.json")
  ? JSON.parse(fs.readFileSync("users.json"))
  : {};

function saveUsers() {
  fs.writeFileSync("users.json", JSON.stringify(users, null, 2));
}

app.post("/login", (req, res) => {
  const { username } = req.body;
  if (!users[username]) {
    users[username] = { wins: 0, losses: 0, games: [] };
    saveUsers();
  }
  res.json({ ok: true });
});

app.get("/stats/:u", (req, res) => {
  const u = users[req.params.u];
  if (!u) return res.json({ wins: 0, losses: 0 });
  const year = Date.now() - 365 * 24 * 60 * 60 * 1000;
  const games = u.games.filter(g => g.date > year);
  res.json({
    wins: games.filter(g => g.win).length,
    losses: games.filter(g => !g.win).length
  });
});

app.post("/admin/login", (req, res) => {
  const { username, password } = req.body;
  res.json({ ok: username === ADMIN_USER && password === ADMIN_PASS });
});

app.get("/admin/users", (req, res) => res.json(users));

app.delete("/admin/user/:name", (req, res) => {
  delete users[req.params.name];
  saveUsers();
  res.json({ ok: true });
});

app.post("/admin/reset", (req, res) => {
  Object.keys(users).forEach(u => {
    users[u] = { wins: 0, losses: 0, games: [] };
  });
  saveUsers();
  res.json({ ok: true });
});

let lobby = [];

io.on("connection", socket => {

  socket.on("joinLobby", username => {

    socket.username = username;

    // aynı kullanıcı var mı kontrol
    const already = lobby.find(s => s.username === username);

    // YOKSA ekle
    if(!already){
      lobby.push(socket);
    }

    // herkese listeyi gönder
    io.emit("lobby", lobby.map(s => s.username));
  });

  socket.on("disconnect", () => {
    lobby = lobby.filter(s => s !== socket);

    io.emit("lobby", lobby.map(s => s.username));
  });

});
server.listen(3000, () => console.log("SERVER READY"));
