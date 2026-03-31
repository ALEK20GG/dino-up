import * as THREE from "three";
import { getYaw } from "./camera.js";
import { collisionMeshes } from "./scene.js";

const raycaster = new THREE.Raycaster();
const downVec   = new THREE.Vector3(0, -1, 0);

// Capsule dims — keep in sync with scene.js
const RADIUS           = 0.4;
const HALF_HEIGHT      = 0.8; // radius + length/2
const RAY_ORIGIN_Y     = 1.0; // offset above player center for down-ray origin

// Wall ray config
const WALL_RAY_DIST    = RADIUS + 0.15; // how close to a wall before pushing back
const WALL_RAY_ORIGINS = [0, 0.5, 1.0]; // heights (relative to feet) to cast horizontal rays

// Movement
let speedForward = 0;
let speedSide    = 0;
const acceleration = 0.02;
const maxSpeed     = 0.15;

// Jump / gravity
let velocityY  = 0;
const gravity  = -0.015;
const jumpForce = 0.3;
let isGrounded  = false;

/* ─── DOWN RAY ─── */
function getGroundHeight(position) {
  const origin = new THREE.Vector3(position.x, position.y + RAY_ORIGIN_Y, position.z);
  raycaster.set(origin, downVec);
  raycaster.far = RAY_ORIGIN_Y + 2.5;
  const hits = raycaster.intersectObjects(collisionMeshes, true);
  return hits.length > 0 ? hits[0].point.y : null;
}

/* ─── WALL RAYS ─── */
// Cast rays in `dir` from multiple heights. Returns how much to push back (0 if clear).
function getWallPenetration(position, dir) {
  let maxPenetration = 0;

  for (const heightOffset of WALL_RAY_ORIGINS) {
    const origin = new THREE.Vector3(
      position.x,
      position.y + heightOffset,  // feet-relative height
      position.z
    );
    raycaster.set(origin, dir);
    raycaster.far = WALL_RAY_DIST;
    const hits = raycaster.intersectObjects(collisionMeshes, true);

    if (hits.length > 0) {
      // How deep we're inside the wall
      const penetration = WALL_RAY_DIST - hits[0].distance;
      maxPenetration = Math.max(maxPenetration, penetration);
    }
  }

  return maxPenetration;
}

/* ─── RESOLVE WALL COLLISIONS ─── */
function resolveWalls(position) {
  // 4 cardinal directions in world space
  const directions = [
    new THREE.Vector3( 1,  0,  0),
    new THREE.Vector3(-1,  0,  0),
    new THREE.Vector3( 0,  0,  1),
    new THREE.Vector3( 0,  0, -1),
  ];

  for (const dir of directions) {
    const penetration = getWallPenetration(position, dir);
    if (penetration > 0) {
      // Push player back out of the wall
      position.x -= dir.x * penetration;
      position.z -= dir.z * penetration;
    }
  }
}

/* ─── MOVEMENT ─── */
export function move(input, player) {
  const yaw = getYaw();

  const forward = new THREE.Vector3( Math.sin(yaw), 0,  Math.cos(yaw));
  const right   = new THREE.Vector3( Math.cos(yaw), 0, -Math.sin(yaw));

  const mv = input.input.moveDir;

  if      (mv.v < 0) speedForward += acceleration;
  else if (mv.v > 0) speedForward -= acceleration;
  else               speedForward *= 0.9;

  if      (mv.h < 0) speedSide += acceleration;
  else if (mv.h > 0) speedSide -= acceleration;
  else               speedSide *= 0.9;

  speedForward = Math.max(-maxSpeed, Math.min(maxSpeed, speedForward));
  speedSide    = Math.max(-maxSpeed, Math.min(maxSpeed, speedSide));

  // Apply horizontal movement first
  player.position.add(forward.clone().multiplyScalar(speedForward));
  player.position.add(right.clone().multiplyScalar(speedSide));

  // Resolve wall collisions AFTER moving
  if (collisionMeshes.length > 0) {
    resolveWalls(player.position);
  }

  /* ─── PLAYER ROTATION ─── */
  const movement = new THREE.Vector3()
    .add(forward.clone().multiplyScalar(speedForward))
    .add(right.clone().multiplyScalar(speedSide));

  if (movement.lengthSq() > 0.0001) {
    const targetRotation = Math.atan2(movement.x, movement.z);
    let diff = targetRotation - player.rotation.y;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    player.rotation.y += diff * 0.15;
  }

  /* ─── JUMP ─── */
  if (input.input.jumpPressed && isGrounded) {
    velocityY  = jumpForce;
    isGrounded = false;
  }

  /* ─── GRAVITY + FLOOR ─── */
  velocityY += gravity;
  player.position.y += velocityY;

  if (collisionMeshes.length > 0) {
    const groundY = getGroundHeight(player.position);
    if (groundY !== null) {
      const floorY = groundY + HALF_HEIGHT;
      if (player.position.y <= floorY) {
        player.position.y = floorY;
        velocityY  = 0;
        isGrounded = true;
      } else {
        isGrounded = false;
      }
    } else {
      isGrounded = false;
      if (player.position.y < -50) {
        player.position.set(0, 5, 0);
        velocityY = 0;
      }
    }
  } else {
    if (player.position.y <= HALF_HEIGHT) {
      player.position.y = HALF_HEIGHT;
      velocityY  = 0;
      isGrounded = true;
    }
  }
}