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
document.body.appendChild(renderer.domElement);

/* LUCI */
scene.add(new THREE.AmbientLight(0xffffff, 0.5));

let light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10, 20, 10);
scene.add(light);

/* TERRENO */
let ground = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 200),
  new THREE.MeshStandardMaterial({ color: 0x808080 })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

scene.add(new THREE.GridHelper(200, 50));

/* PLAYER */
export const player = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshStandardMaterial({ color: 0x00ff00 })
);
player.position.y = 0.5;
scene.add(player);