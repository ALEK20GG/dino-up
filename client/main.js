import * as THREE from "three";
import { scene, camera, renderer } from "./scene.js";
import Input from "./input.js";
import Player from "./player.js";
import { updateCameraRotation, updateCameraPosition } from "./camera.js";

/* ─── WEBSOCKET ─── */
const WS_URL = "wss://dino-up.onrender.com/";
const socket = new WebSocket(WS_URL);

let myId = null;
const remotePlayers = {}; // id → Player instance

/* ─── LOCAL PLAYER ─── */
const input = new Input();
const localPlayer = new Player(scene, "local");
localPlayer.load("#A4C639").then(() => console.log("Local player ready"));

/* ─── POINTER LOCK ─── */
document.body.addEventListener("click", () => document.body.requestPointerLock());

let mouseX = 0;
let mouseY = 0;
document.addEventListener("mousemove", e => {
  if (document.pointerLockElement === document.body) {
    mouseX = e.movementX;
    mouseY = e.movementY;
  }
});

/* ─── SOCKET MESSAGES ─── */
socket.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === "init") {
    myId = data.id;
    // Spawn any players already in the server
    for (const id in data.players) {
      if (id !== myId) spawnRemote(id, data.players[id]);
    }
  }

  if (data.type === "state") {
    // Spawn new players
    for (const id in data.players) {
      if (id !== myId && !remotePlayers[id]) spawnRemote(id, data.players[id]);
    }
    // Remove disconnected players
    for (const id in remotePlayers) {
      if (!data.players[id]) destroyRemote(id);
    }
    // Update existing remote players
    for (const id in remotePlayers) {
      if (data.players[id]) remotePlayers[id].updateRemote(data.players[id]);
    }
  }

  if (data.type === "disconnect") {
    destroyRemote(data.id);
  }
};

function spawnRemote(id, playerData) {
  console.log("Spawning remote player:", id);
  const p = new Player(scene, "remote");
  p.load("#ff6666").then(() => {
    remotePlayers[id] = p;       // only register AFTER frames are loaded
    p.updateRemote(playerData);  // set initial position + frame
  });
}

function destroyRemote(id) {
  if (remotePlayers[id]) {
    remotePlayers[id].destroy();
    delete remotePlayers[id];
    console.log("Removed remote player:", id);
  }
}

/* ─── ANIMATE LOOP ─── */
function animate() {
  requestAnimationFrame(animate);

  input.update();

  updateCameraRotation(input, mouseX, mouseY);
  mouseX = 0;
  mouseY = 0;

  localPlayer.updateLocal(input);
  updateCameraPosition(camera, localPlayer.position);

  renderer.render(scene, camera);

  // Send local state to server
  if (socket.readyState === WebSocket.OPEN && myId) {
    socket.send(JSON.stringify({
      type:      "update",
      x:         localPlayer.position.x,
      y:         localPlayer.position.y,
      z:         localPlayer.position.z,
      yaw:       localPlayer.yaw,
      animFrame: localPlayer.animFrame,
    }));
  }
}

animate();