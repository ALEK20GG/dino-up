import { WebSocketServer } from "ws";
import crypto from "crypto";

const PORT = process.env.PORT || 8081;
const wss = new WebSocketServer({ port: PORT });

console.log(`Server avviato su ws://localhost:${PORT}`);

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
