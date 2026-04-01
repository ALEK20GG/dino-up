import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

export const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

export const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

/* ─── RESIZE ─── */
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* ─── LIGHTS ─── */
scene.add(new THREE.AmbientLight(0xffffff, 0.5));

let light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10, 20, 10);
light.castShadow = true;
scene.add(light);

/* ─── COLLISION MESHES ─── */
export const collisionMeshes = [];

/* ─── MAP (GLB) ─── */
export let mapLoaded = false;

const loader = new GLTFLoader();
loader.load(
  "./map.glb",
  (gltf) => {
    const map = gltf.scene;
    map.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        collisionMeshes.push(child);
      }
    });
    scene.add(map);
    mapLoaded = true;
    console.log("Map loaded:", collisionMeshes.length, "collision meshes");
  },
  (xhr) => {
    console.log(`Map loading: ${Math.round((xhr.loaded / xhr.total) * 100)}%`);
  },
  (error) => {
    console.error("Failed to load map.glb:", error);
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200),
      new THREE.MeshStandardMaterial({ color: 0x808080 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    collisionMeshes.push(ground);
    mapLoaded = true;
  }
);



/* ─── PLAYER BOX (fisica, invisibile) ─── */
export const player = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshStandardMaterial({ color: 0x00ff00 })
);
player.position.y = 2;
player.castShadow = true;
player.visible = false;
scene.add(player);

/* ─── PLAYER MODEL (visivo) ─── */
export const playerModel = new THREE.Group();
playerModel.position.y = 2;
playerModel.scale.set(60, 60, 60);
scene.add(playerModel);

const frameFiles = [
  "./player/0.glb",
  "./player/1.glb",
  "./player/2.glb",
  "./player/3.glb",
  "./player/4.glb",
  "./player/5.glb",
  "./player/6.glb",
  "./player/7.glb",
];

let playerFrameScenes = [];
let currentFrame = 0;
let frameTimer = 0;
const FRAME_DURATION = 0.1;

export const MODEL_VISUAL_OFFSET = -0.8; // REGOLA QUESTO VALORE SE NECESSARIO

/* ─── CARICA MODELLO LOCALE ─── */
export async function loadPlayerAnimations() {
  console.log("Loading player animations...");
  const playerLoader = new GLTFLoader();

  const promises = frameFiles.map(
    (file) =>
      new Promise((resolve, reject) =>
        playerLoader.load(file, (gltf) => {
          console.log("Loaded:", file);
          resolve(gltf.scene);
        }, undefined, reject)
      )
  );

  try {
    playerFrameScenes = await Promise.all(promises);
    console.log("All frames loaded, count:", playerFrameScenes.length);
  } catch (err) {
    console.error("Error loading frames:", err);
    return;
  }

  playerFrameScenes.forEach((frameScene, i) => {
    // Mostra solo il primo frame all'inizio
    frameScene.visible = i === 0;
    
    // Calcola il bounding box per centrare il modello
    const box = new THREE.Box3().setFromObject(frameScene);
    const minY = box.min.y;
    
    // Sposta il modello in modo che la sua base sia a Y=0
    frameScene.position.y = -minY;
    
    frameScene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    playerModel.add(frameScene);
  });

  // Applica colore verde per il player locale
  playerModel.traverse((child) => {
    if (child.isMesh && child.material) {
      child.material.color.set("#A4C639");
    }
  });

  console.log("Player model ready");
  return playerFrameScenes;
}

/* ─── CARICA MODELLO PER GIOCATORI REMOTI ─── */
export async function loadPlayerModelForRemote() {
  console.log("Loading remote player model...");
  const playerLoader = new GLTFLoader();

  const promises = frameFiles.map(
    (file) =>
      new Promise((resolve, reject) =>
        playerLoader.load(file, (gltf) => resolve(gltf.scene), undefined, reject)
      )
  );

  const frameScenes = await Promise.all(promises);

  frameScenes.forEach((frameScene) => {
    const box = new THREE.Box3().setFromObject(frameScene);
    const minY = box.min.y;
    frameScene.position.y = -minY;
  });

  console.log("Remote player model ready, frames:", frameScenes.length);
  return frameScenes;
}

/* ─── AGGIORNA ANIMAZIONE PLAYER LOCALE ─── */
export function updatePlayerAnimation(isMoving) {
  // Se i frame non sono ancora caricati, esci
  if (!playerFrameScenes || playerFrameScenes.length === 0) {
    return;
  }

  if (isMoving) {
    // Aggiorna timer basato su delta time (approssimato a 60fps)
    frameTimer += 1 / 60;
    
    if (frameTimer >= FRAME_DURATION) {
      frameTimer = 0;
      
      // Nascondi frame corrente
      if (playerFrameScenes[currentFrame]) {
        playerFrameScenes[currentFrame].visible = false;
      }
      
      // Passa al frame successivo
      currentFrame = (currentFrame + 1) % playerFrameScenes.length;
      
      // Mostra nuovo frame
      if (playerFrameScenes[currentFrame]) {
        playerFrameScenes[currentFrame].visible = true;
      }
      
      // Debug: stampa ogni cambio frame (opzionale, rimuovi dopo)
      // console.log("Animation frame:", currentFrame);
    }
  } else {
    // Se non in movimento, resetta al primo frame
    if (currentFrame !== 0) {
      if (playerFrameScenes[currentFrame]) {
        playerFrameScenes[currentFrame].visible = false;
      }
      currentFrame = 0;
      if (playerFrameScenes[0]) {
        playerFrameScenes[0].visible = true;
      }
    }
    frameTimer = 0;
  }
}