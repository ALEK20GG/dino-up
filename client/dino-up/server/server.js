import { WebSocketServer } from "ws";
import http from "http";
import crypto from "crypto";

/* ─── SERVER HTTP + WEBSOCKET ───────────── */

const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end("OK");
});

const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 8081;
server.listen(PORT, () => {
  console.log(`Server avviato su porta ${PORT}`);
});

/* ─── STATO GIOCO ───────────────────────── */

let players = {}; // id → player

function createPlayer(id) {
  return {
    id,
    x: 0,
    y: 0.5,
    z: 0,
    yaw: 0
  };
}

/* ─── CONNESSIONE ───────────────────────── */

wss.on("connection", (ws) => {

  const id = crypto.randomUUID();

  console.log("Player connesso:", id);

  players[id] = createPlayer(id);

  ws.send(JSON.stringify({
    type: "init",
    id,
    players
  }));

  /* ─── MESSAGGI DAL CLIENT ─────────────── */

  ws.on("message", (msg) => {

    const data = JSON.parse(msg);

    if (data.type === "update") {

      const p = players[id];
      if (!p) return;

      // aggiorna stato player
      p.x = data.x;
      p.y = data.y;
      p.z = data.z;
      p.yaw = data.yaw;

    }

  });

  /* ─── DISCONNESSIONE ─────────────────── */

  ws.on("close", () => {
    console.log("Player disconnesso:", id);
    delete players[id];
  });

});

/* ─── LOOP SERVER (broadcast) ───────────── */

setInterval(() => {

  const state = JSON.stringify({
    type: "state",
    players
  });

  wss.clients.forEach(client => {
    if (client.readyState === 1) {
      client.send(state);
    }
  });

}, 50); // 20 FPS
