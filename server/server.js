import { WebSocketServer } from "ws";
import http from "http";
import crypto from "crypto";

const server = http.createServer((req, res) => { res.writeHead(200); res.end("OK"); });
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 8081;
server.listen(PORT, () => console.log(`Server on port ${PORT}`));

let players = {};

function createPlayer(id) {
  return { id, x: 0, y: 2, z: 0, yaw: 0, animFrame: 0 };
}

wss.on("connection", (ws) => {
  const id = crypto.randomUUID();
  console.log("Connected:", id);

  players[id] = createPlayer(id);
  ws.send(JSON.stringify({ type: "init", id, players }));

  ws.on("message", (msg) => {
    const data = JSON.parse(msg);
    if (data.type === "update") {
      const p = players[id];
      if (!p) return;
      p.x         = data.x;
      p.y         = data.y;
      p.z         = data.z;
      p.yaw       = data.yaw;
      p.animFrame = data.animFrame ?? 0;
    }
  });

  ws.on("close", () => {
    console.log("Disconnected:", id);
    delete players[id];
    const disconnectMsg = JSON.stringify({ type: "disconnect", id });
    wss.clients.forEach(c => {
      if (c.readyState === 1) c.send(disconnectMsg);
    });
  });
});

setInterval(() => {
  const state = JSON.stringify({ type: "state", players });
  wss.clients.forEach(c => { if (c.readyState === 1) c.send(state); });
}, 50);