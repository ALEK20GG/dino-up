import * as THREE from "three";
import { getYaw } from "./camera.js";
import { collisionMeshes } from "./scene.js";

let speedForward = 0;
let speedSide = 0;

const acceleration = 0.02;
const maxSpeed = 0.3;

/* ─── JUMP + GRAVITY ─── */
let velocityY = 0;
const gravity = -0.015;
const jumpForce = 0.25;
let isGrounded = false;

/* ─── RAYCASTER for map collision ─── */
const raycaster = new THREE.Raycaster();
const downVec = new THREE.Vector3(0, -1, 0);

const RAY_ORIGIN_OFFSET = 1.0;
const PLAYER_HALF_HEIGHT = 0.5;

function getGroundHeight(position) {
  const origin = new THREE.Vector3(
    position.x,
    position.y + RAY_ORIGIN_OFFSET,
    position.z
  );
  raycaster.set(origin, downVec);
  raycaster.far = RAY_ORIGIN_OFFSET + 2.5;

  const hits = raycaster.intersectObjects(collisionMeshes, true);

  if (hits.length > 0) {
    return hits[0].point.y;
  }

  return null;
}

/* ─── MOVEMENT ─── */
export function move(input, player) {
  const yaw = getYaw();

  const forward = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
  const right   = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));

  const mv = input.input.moveDir;

  if (mv.v < 0) speedForward += acceleration;
  else if (mv.v > 0) speedForward -= acceleration;
  else speedForward *= 0.9;

  if (mv.h < 0) speedSide += acceleration;
  else if (mv.h > 0) speedSide -= acceleration;
  else speedSide *= 0.9;

  speedForward = Math.max(-maxSpeed, Math.min(maxSpeed, speedForward));
  speedSide    = Math.max(-maxSpeed, Math.min(maxSpeed, speedSide));

  player.position.add(forward.clone().multiplyScalar(speedForward));
  player.position.add(right.clone().multiplyScalar(speedSide));

  /* ─── PLAYER ROTATION ─── */
  const movement = new THREE.Vector3();
  movement.add(forward.clone().multiplyScalar(speedForward));
  movement.add(right.clone().multiplyScalar(speedSide));

  if (movement.lengthSq() > 0.0001) {
    const targetRotation = Math.atan2(movement.x, movement.z);
    const smooth = 0.15;
    let diff = targetRotation - player.rotation.y;
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

  /* ─── MAP COLLISION ─── */
  if (collisionMeshes.length > 0) {
    const groundY = getGroundHeight(player.position);

    if (groundY !== null) {
      const floorY = groundY + PLAYER_HALF_HEIGHT;
      if (player.position.y <= floorY) {
        player.position.y = floorY;
        velocityY = 0;
        isGrounded = true;
      } else {
        isGrounded = false;
      }
    } else {
      isGrounded = false;
      // Safety net — respawn if fallen too far
      if (player.position.y < -50) {
        player.position.set(0, 5, 0);
        velocityY = 0;
      }
    }
  } else {
    // Fallback while map is loading
    if (player.position.y <= PLAYER_HALF_HEIGHT) {
      player.position.y = PLAYER_HALF_HEIGHT;
      velocityY = 0;
      isGrounded = true;
    }
  }
}