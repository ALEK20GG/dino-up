import * as THREE from "three";
import { scene, camera, renderer, player, playerModel, loadPlayerAnimations, loadPlayerModelForRemote, MODEL_VISUAL_OFFSET } from "./scene.js";
import Input from "./input.js";
import { move } from "./movement.js";
import { updateCameraRotation, updateCameraPosition, getYaw } from "./camera.js";


/* ─── SERVER CONNECTION ─────────────────────────────────────── */

const WS_URL = "wss://dino-up.onrender.com/";

const socket = new WebSocket(WS_URL);

let myId = null;
let otherPlayers = {};
let remotePlayers = {};

/* ─── DATA RECEIVING ─── */
socket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log("Socket message:", data.type);

  if (data.type === "init") {
    myId = data.id;
    otherPlayers = data.players;
    console.log("Init - myId:", myId, "players:", Object.keys(otherPlayers));
    
    for (let id in otherPlayers) {
      if (id !== myId) {
        createRemotePlayer(id, otherPlayers[id]);
      }
    }
  }

  if (data.type === "state") {
    // Gestisci nuovi giocatori
    for (let id in data.players) {
      if (id !== myId && !remotePlayers[id]) {
        console.log("New player joined:", id);
        createRemotePlayer(id, data.players[id]);
      }
    }
    
    // Rimuovi giocatori disconnessi
    for (let id in remotePlayers) {
      if (!data.players[id]) {
        console.log("Player left:", id);
        removeRemotePlayer(id);
      }
    }
    
    otherPlayers = data.players;
  }
};

/* ─── FUNZIONI PER GESTIRE GIOCATORI REMOTI ─── */

async function createRemotePlayer(id, playerData) {
  console.log("Creating remote player:", id, "at position:", playerData);
  
  const frameScenes = await loadPlayerModelForRemote();
  
  const modelGroup = new THREE.Group();
  modelGroup.position.set(playerData.x, playerData.y + MODEL_VISUAL_OFFSET, playerData.z);
  modelGroup.rotation.y = playerData.yaw;
  modelGroup.scale.set(60, 60, 60);
  
  frameScenes.forEach((frame, i) => {
    frame.visible = i === 0;
    frame.traverse((child) => {
      if (child.isMesh && child.material) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.material.transparent = true;
        child.material.opacity = 0.6;
        child.material.color.setHex(0xff6666);
      }
    });
    modelGroup.add(frame);
  });
  
  scene.add(modelGroup);
  console.log("Remote player added to scene:", id);
  
  remotePlayers[id] = {
    group: modelGroup,
    frameScenes: frameScenes,
    currentFrame: 0,
    frameTimer: 0,
    lastPosition: new THREE.Vector3(playerData.x, playerData.y, playerData.z),
    lastYaw: playerData.yaw,
    isMoving: false
  };
}

function removeRemotePlayer(id) {
  if (remotePlayers[id]) {
    scene.remove(remotePlayers[id].group);
    delete remotePlayers[id];
  }
}

function updateRemotePlayerAnimation(remotePlayer, isMoving) {
  const { frameScenes } = remotePlayer;
  
  // Controllo di sicurezza
  if (!frameScenes || frameScenes.length === 0) {
    console.warn("No frames for remote player");
    return;
  }
  
  if (isMoving) {
    // Aggiorna timer
    remotePlayer.frameTimer += 1 / 60;
    
    if (remotePlayer.frameTimer >= 0.1) { // FRAME_DURATION
      remotePlayer.frameTimer = 0;
      
      // Nascondi frame corrente
      if (frameScenes[remotePlayer.currentFrame]) {
        frameScenes[remotePlayer.currentFrame].visible = false;
      }
      
      // Passa al frame successivo
      remotePlayer.currentFrame = (remotePlayer.currentFrame + 1) % frameScenes.length;
      
      // Mostra nuovo frame
      if (frameScenes[remotePlayer.currentFrame]) {
        frameScenes[remotePlayer.currentFrame].visible = true;
      }
      
      // Debug: stampa ogni 30 cambi frame per non spamare
      if (Math.random() < 0.03) {
        console.log("Remote player animation frame:", remotePlayer.currentFrame);
      }
    }
  } else {
    // Se non in movimento, resetta al primo frame
    if (remotePlayer.currentFrame !== 0) {
      if (frameScenes[remotePlayer.currentFrame]) {
        frameScenes[remotePlayer.currentFrame].visible = false;
      }
      remotePlayer.currentFrame = 0;
      if (frameScenes[0]) {
        frameScenes[0].visible = true;
      }
    }
    remotePlayer.frameTimer = 0;
  }
}

const input = new Input();

/* ─── POINTER LOCK ─── */
document.body.addEventListener("click", () => {
  document.body.requestPointerLock();
  console.log("Pointer lock requested");
});

let mouseX = 0;
let mouseY = 0;

document.addEventListener("mousemove", e => {
  if (document.pointerLockElement === document.body) {
    mouseX = e.movementX;
    mouseY = e.movementY;
  }
});

/* ─── CARICA MODELLO LOCALE ─── */
loadPlayerAnimations().then(() => {
  console.log("Local player model ready");
}).catch(err => {
  console.error("Failed to load local player:", err);
});

/* ─── LOOP ─── */
let frameCount = 0;
let lastDebugTime = Date.now();

function animate() {
  requestAnimationFrame(animate);
  frameCount++;

  input.update();

  updateCameraRotation(input, mouseX, mouseY);
  mouseX = 0;
  mouseY = 0;

  move(input, player);

  updateCameraPosition(camera, player);

  renderer.render(scene, camera);

  // Invia posizione al server
  if (socket.readyState === WebSocket.OPEN && myId) {
    socket.send(JSON.stringify({
      type: "update",
      x: player.position.x,
      y: player.position.y,
      z: player.position.z,
      yaw: getYaw()
    }));
  }

  // Aggiorna i giocatori remoti
  for (let id in remotePlayers) {
    const p = otherPlayers[id];
    const remote = remotePlayers[id];
    
    if (p && remote) {
      // Aggiorna posizione
      remote.group.position.set(p.x, p.y + MODEL_VISUAL_OFFSET, p.z);
      remote.group.rotation.y = p.yaw;
      
      // Calcola se si sta muovendo (differenza di posizione)
      const currentPos = new THREE.Vector3(p.x, p.y, p.z);
      const distance = currentPos.distanceTo(remote.lastPosition);
      const isMoving = distance > 0.01;
      
      // Debug ogni secondo
      const now = Date.now();
      if (now - lastDebugTime > 1000 && isMoving) {
        console.log(`Remote player ${id} is MOVING, distance: ${distance.toFixed(4)}`);
        lastDebugTime = now;
      }
      
      // Aggiorna animazione
      updateRemotePlayerAnimation(remote, isMoving);
      
      // Salva posizione per il prossimo frame
      remote.lastPosition.copy(currentPos);
      remote.lastYaw = p.yaw;
    }
  }
}

animate();