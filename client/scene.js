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
// Holds all meshes from the map that the player can stand on
export const collisionMeshes = [];

/* ─── MAP (GLB) ─── */
export let mapLoaded = false;

const loader = new THREE.GLTFLoader();
loader.load(
  "./map.glb",
  (gltf) => {
    const map = gltf.scene;

    // Traverse and collect all meshes for collision, enable shadows
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
    // Fallback: add a flat ground so the game still works
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

/* ─── GRID HELPER (optional, remove if unwanted) ─── */
scene.add(new THREE.GridHelper(200, 50));

/* ─── PLAYER ─── */
export const player = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshStandardMaterial({ color: 0x00ff00 })
);
player.position.y = 2; // start above ground so it falls into place
player.castShadow = true;
scene.add(player);