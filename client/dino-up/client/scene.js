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
    // Fallback flat ground
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

/* ─── PLAYER ─── */
export const player = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshStandardMaterial({ color: 0x00ff00 })
);
player.position.y = 2;
player.castShadow = true;
scene.add(player);