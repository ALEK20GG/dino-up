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

/* ─── GRID HELPER ─── */
scene.add(new THREE.GridHelper(200, 50));

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

let frameScenes = [];
let currentFrame = 0;
let frameTimer = 0;
const FRAME_DURATION = 0.1;

async function loadPlayerAnimations() {
  const playerLoader = new GLTFLoader();

  const promises = frameFiles.map(
    (file) =>
      new Promise((resolve, reject) =>
        playerLoader.load(file, (gltf) => resolve(gltf.scene), undefined, reject)
      )
  );

  frameScenes = await Promise.all(promises);

  frameScenes.forEach((frameScene, i) => {
    frameScene.visible = i === 0;
    frameScene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    playerModel.add(frameScene);
  });

  // Applica colore verde Android
  playerModel.traverse((child) => {
    if (child.isMesh) child.material.color.set("#A4C639");
  });

  console.log("Player loaded with", frameScenes.length, "frames");
}

export function updatePlayerAnimation(isMoving) {
  if (frameScenes.length === 0) return;

  if (isMoving) {
    frameTimer += 1 / 60;
    if (frameTimer >= FRAME_DURATION) {
      frameTimer = 0;
      frameScenes[currentFrame].visible = false;
      currentFrame = (currentFrame + 1) % frameScenes.length;
      frameScenes[currentFrame].visible = true;
    }
  } else {
    if (currentFrame !== 0) {
      frameScenes[currentFrame].visible = false;
      currentFrame = 0;
      frameScenes[0].visible = true;
    }
    frameTimer = 0;
  }
}

loadPlayerAnimations().catch(console.error);