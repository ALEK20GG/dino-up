import { getYaw } from "./camera.js";

let speedForward = 0;
let speedSide = 0;

const acceleration = 0.02;
const deceleration = 0.015;
const maxSpeed = 0.3;

/* ─── JUMP + GRAVITY ─── */

let velocityY = 0;
const gravity = -0.01;
const jumpForce = 0.25;
let isGrounded = true;

/* ─── MOVEMENT ─── */

export function move(input, player) {
  const yaw = getYaw();

  const forward = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
  const right   = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));

  const mv = input.input.moveDir;

  // avanti / indietro
  if (mv.v < 0) speedForward += acceleration;
  else if (mv.v > 0) speedForward -= acceleration;
  else speedForward *= 0.9;

  // laterale
  if (mv.h < 0) speedSide += acceleration;
  else if (mv.h > 0) speedSide -= acceleration;
  else speedSide *= 0.9;

  speedForward = Math.max(-maxSpeed, Math.min(maxSpeed, speedForward));
  speedSide    = Math.max(-maxSpeed, Math.min(maxSpeed, speedSide));

  player.position.add(forward.clone().multiplyScalar(speedForward));
  player.position.add(right.clone().multiplyScalar(speedSide));

  // rotazione player
  if (speedForward !== 0 || speedSide !== 0) {

    const moveAngle = Math.atan2(speedSide, speedForward);
  
    // direzione movimento nel mondo (non più camera + move)
    const targetRotation = moveAngle;
  
    // SMOOTH ROTATION PLAYER
    const smooth = 0.15;
  
    let diff = targetRotation - player.rotation.y;
  
    // normalizza angolo (-PI, PI)
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
  
    player.rotation.y += diff * smooth;
  }

  /* ─── JUMP ─── */
  if (input.input.jumpPressed && isGrounded) {
    velocityY = jumpForce;
    isGrounded = false;
  }

  /* ─── GRAVITY ─── */
  velocityY += gravity;
  player.position.y += velocityY;

  if (player.position.y <= 0.5) {
    player.position.y = 0.5;
    velocityY = 0;
    isGrounded = true;
  }
}