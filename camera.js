let yaw = 0;
let pitch = 0;

//temp
const hsign = 1;
const vsign = -1;

const CAM_YAW_SPEED = 0.03;
const CAM_PITCH_SPEED = 0.02;
const MOUSE_SENSITIVITY = 0.002;

/* ─── INPUT CAMERA ─── */

export function updateCameraRotation(input, mouseX = 0, mouseY = 0) {

  // 🎮 RIGHT STICK
  const cam = input.input.camDir;

  yaw   -= cam.h * CAM_YAW_SPEED;
  pitch -= cam.v * CAM_PITCH_SPEED;

  // 🖱️ MOUSE
  yaw   -= mouseX * MOUSE_SENSITIVITY;
  pitch -= mouseY * MOUSE_SENSITIVITY;

  // 🔒 LIMITA PITCH (evita flip)
  const maxPitch = Math.PI / 2 - 0.1;
  pitch = Math.max(-maxPitch, Math.min(maxPitch, pitch));
}

/* ─── GETTERS (IMPORTANTE) ─── */

export function getYaw() {
  return yaw;
}

/* ─── CAMERA POSITION ─── */

export function updateCameraPosition(camera, player) {

  const distance = 8;
  const height = 4;

  const x = player.position.x - Math.sin(yaw) * distance * Math.cos(pitch) * hsign;
  const z = player.position.z - Math.cos(yaw) * distance * Math.cos(pitch) * hsign;
  const y = player.position.y + height + Math.sin(pitch) * distance * vsign;

  const smooth = 0.3;

  camera.position.x += (x - camera.position.x) * smooth;
  camera.position.y += (y - camera.position.y) * smooth;
  camera.position.z += (z - camera.position.z) * smooth;

  const target = new THREE.Vector3(
    player.position.x,
    player.position.y + 1,
    player.position.z
  );
  
  camera.lookAt(target);
}