import * as THREE from "three";

let yaw = 0;
let pitch = 0;

const hsign = 1;
const vsign = -1;

const CAM_YAW_SPEED = 0.03;
const CAM_PITCH_SPEED = 0.02;
const MOUSE_SENSITIVITY = 0.002;

// Reuse vectors to avoid garbage collection
const _cameraTarget = new THREE.Vector3();
const _cameraPos = new THREE.Vector3();

/* ─── INPUT CAMERA ─── */

export function updateCameraRotation(input, mouseX = 0, mouseY = 0) {

  const cam = input.input.camDir;

  yaw   -= cam.h * CAM_YAW_SPEED;
  pitch -= cam.v * CAM_PITCH_SPEED;

  yaw   -= mouseX * MOUSE_SENSITIVITY;
  pitch -= mouseY * MOUSE_SENSITIVITY;

  const maxPitch = Math.PI / 2 - 0.1;
  pitch = Math.max(-maxPitch, Math.min(maxPitch, pitch));
}

/* ─── GETTERS ─── */

export function getYaw() {
  return yaw;
}

/* ─── CAMERA POSITION ─── */

// playerPos può essere un Vector3 oppure un oggetto con .position (Three.js Object3D)
export function updateCameraPosition(camera, playerPos) {

  const pos = playerPos.isVector3 ? playerPos : playerPos.position;

  const distance = 8;
  const height = 4;

  const x = pos.x - Math.sin(yaw) * distance * Math.cos(pitch) * hsign;
  const z = pos.z - Math.cos(yaw) * distance * Math.cos(pitch) * hsign;
  const y = pos.y + height + Math.sin(pitch) * distance * vsign;

  const smooth = 0.3;

  camera.position.x += (x - camera.position.x) * smooth;
  camera.position.y += (y - camera.position.y) * smooth;
  camera.position.z += (z - camera.position.z) * smooth;

  _cameraTarget.x = pos.x;
  _cameraTarget.y = pos.y + 1;
  _cameraTarget.z = pos.z;

  camera.lookAt(_cameraTarget);
}