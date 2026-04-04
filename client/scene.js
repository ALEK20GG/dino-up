import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

export const camera = new THREE.PerspectiveCamera(
  75, window.innerWidth / window.innerHeight, 0.1, 1000
);

export const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* ─── LIGHTS ─── */
scene.add(new THREE.AmbientLight(0xffffff, 0.5));
const sun = new THREE.DirectionalLight(0xffffff, 1);
sun.position.set(10, 20, 10);
scene.add(sun);

/* ─── COLLISION MESHES ─── */
export const collisionMeshes = [];

let _mapLoaded = false;
const _mapLoadCallbacks = [];

export function onMapLoaded(callback) {
  _mapLoadCallbacks.push(callback);
  if (_mapLoaded) callback();
}

function _fireMapLoaded() {
  _mapLoaded = true;
  _mapLoadCallbacks.forEach(cb => cb());
}

/* ─── MAP ─── */
const loader = new GLTFLoader();
loader.load(
  "./map.glb",
  (gltf) => {
    gltf.scene.traverse(child => {
      if (child.isMesh) {
        collisionMeshes.push(child);
      }
    });
    scene.add(gltf.scene);
    console.log("Map loaded:", collisionMeshes.length, "meshes");
    _fireMapLoaded();
  },
  undefined,
  () => {
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200),
      new THREE.MeshStandardMaterial({ color: 0x808080 })
    );
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);
    collisionMeshes.push(ground);
    console.log("Map failed, using fallback ground");
    _fireMapLoaded();
  }
);