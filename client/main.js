import * as THREE from "three";
import { scene, camera, renderer, player } from "./scene.js";
import Input from "./input.js";
import { move } from "./movement.js";
import { updateCameraRotation, updateCameraPosition, getYaw } from "./camera.js";


/* ─── SERVER CONNECTION ─────────────────────────────────────── */

const WS_URL = "wss://dino-up.onrender.com/"; // ← sostituisci con il tuo URL Render

const socket = new WebSocket(WS_URL);

let myId = null;
let otherPlayers = {};
let meshes = {};

/* ─── DATA RECEIVING ─── */
socket.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === "init") {
    myId = data.id;
    otherPlayers = data.players;
  }

  if (data.type === "state") {
    otherPlayers = data.players;
  }
};

const input = new Input();

/* ─── POINTER LOCK ─── */
document.body.addEventListener("click", () => {
  document.body.requestPointerLock();
});

let mouseX = 0;
let mouseY = 0;

document.addEventListener("mousemove", e => {
  if (document.pointerLockElement === document.body) {
    mouseX = e.movementX;
    mouseY = e.movementY;
  }
});

/* ─── LOOP ─── */
function animate() {
  requestAnimationFrame(animate);

  input.update();

  updateCameraRotation(input, mouseX, mouseY);
  mouseX = 0;
  mouseY = 0;

  move(input, player);

  updateCameraPosition(camera, player);

  renderer.render(scene, camera);

  if (socket.readyState === WebSocket.OPEN && myId) {
    socket.send(JSON.stringify({
      type: "update",
      x: player.position.x,
      y: player.position.y,
      z: player.position.z,
      yaw: getYaw()
    }));
  }

  for (let id in otherPlayers) {
    if (id === myId) continue;

    let p = otherPlayers[id];

    if (!meshes[id]) {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshStandardMaterial({ color: 0xff0000 })
      );
      scene.add(mesh);
      meshes[id] = mesh;
    }

    meshes[id].position.set(p.x, p.y, p.z);
    meshes[id].rotation.y = p.yaw;
  }
}
animate();