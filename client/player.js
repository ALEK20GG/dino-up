import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { collisionMeshes } from "./scene.js";
import { getYaw } from "./camera.js";

/* ─── SHARED FRAME FILES ─── */
const FRAME_FILES = [
  "./player/0.glb", "./player/1.glb", "./player/2.glb", "./player/3.glb",
  "./player/4.glb", "./player/5.glb", "./player/6.glb", "./player/7.glb",
];
const FRAME_DURATION  = 0.1;   // seconds per animation frame
const MODEL_SCALE     = 60;
const MODEL_Y_OFFSET  = -0.8;  // visual model offset from physics position

/* ─── PHYSICS CONSTANTS ─── */
const RADIUS          = 0.4;
const HALF_HEIGHT     = 0.8;   // radius + half cylinder = 0.4 + 0.4
const RAY_ORIGIN_Y    = 1.0;
const WALL_RAY_DIST   = RADIUS + 0.15;
const WALL_RAY_ORIGINS = [0, 0.5, 1.0];

const ACCELERATION    = 0.02;
const MAX_SPEED       = 0.15;
const GRAVITY         = -0.015;
const JUMP_FORCE      = 0.3;

/* ─── RAYCASTER (shared, one instance is fine) ─── */
const raycaster = new THREE.Raycaster();
const DOWN = new THREE.Vector3(0, -1, 0);
const UP   = new THREE.Vector3(0,  1, 0);

function getGroundY(pos) {
  raycaster.set(new THREE.Vector3(pos.x, pos.y + RAY_ORIGIN_Y, pos.z), DOWN);
  raycaster.far = RAY_ORIGIN_Y + 2.5;
  const hits = raycaster.intersectObjects(collisionMeshes, true);
  return hits.length > 0 ? hits[0].point.y : null;
}

function getCeilingY(pos) {
  raycaster.set(new THREE.Vector3(pos.x, pos.y + HALF_HEIGHT, pos.z), UP);
  raycaster.far = RADIUS + 0.2;
  const hits = raycaster.intersectObjects(collisionMeshes, true);
  return hits.length > 0 ? hits[0].point.y : null;
}

function getWallPenetration(pos, dir) {
  let max = 0;
  for (const h of WALL_RAY_ORIGINS) {
    raycaster.set(new THREE.Vector3(pos.x, pos.y + h, pos.z), dir);
    raycaster.far = WALL_RAY_DIST;
    const hits = raycaster.intersectObjects(collisionMeshes, true);
    if (hits.length > 0) max = Math.max(max, WALL_RAY_DIST - hits[0].distance);
  }
  return max;
}

const WALL_DIRS = [
  new THREE.Vector3( 1, 0,  0), new THREE.Vector3(-1, 0,  0),
  new THREE.Vector3( 0, 0,  1), new THREE.Vector3( 0, 0, -1),
];

function resolveWalls(pos) {
  for (const dir of WALL_DIRS) {
    const pen = getWallPenetration(pos, dir);
    if (pen > 0) { pos.x -= dir.x * pen; pos.z -= dir.z * pen; }
  }
}

/* ─── LOAD FRAMES HELPER ─── */
async function loadFrames(color) {
  const loader = new GLTFLoader();
  const scenes = await Promise.all(
    FRAME_FILES.map(f => new Promise((res, rej) =>
      loader.load(f, g => res(g.scene), undefined, rej)
    ))
  );

  scenes.forEach(s => {
    const box = new THREE.Box3().setFromObject(s);
    s.position.y = -box.min.y; // ground the model
    s.traverse(child => {
      if (child.isMesh && child.material) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.material = child.material.clone(); // avoid shared material mutation
        child.material.color.set(color);
      }
    });
  });

  return scenes;
}

/* ═══════════════════════════════════════════════════════════════
   PLAYER CLASS
   mode: "local"  → controlled by input, has physics
         "remote" → position/frame set from server data
═══════════════════════════════════════════════════════════════ */
export default class Player {

  constructor(scene, mode = "local") {
    this.scene  = scene;
    this.mode   = mode;
    this.loaded = false;

    /* ─── PHYSICS BODY (invisible) ─── */
    this.body = new THREE.Mesh(
      new THREE.CapsuleGeometry(RADIUS, HALF_HEIGHT - RADIUS * 2 + RADIUS, 8, 16),
      new THREE.MeshStandardMaterial({ color: 0x00ff00, visible: false })
    );
    this.body.position.set(0, 2, 0);
    scene.add(this.body);

    /* ─── VISUAL MODEL GROUP ─── */
    this.modelGroup = new THREE.Group();
    this.modelGroup.scale.setScalar(MODEL_SCALE);
    scene.add(this.modelGroup);

    /* ─── ANIMATION STATE ─── */
    this.frames       = [];
    this.currentFrame = 0;
    this.frameTimer   = 0;

    /* ─── PHYSICS STATE (local only) ─── */
    this.velocityY  = 0;
    this.isGrounded = false;
    this.speedForward = 0;
    this.speedSide    = 0;
    this.lastRemotePosition = new THREE.Vector3();
  }

  /* ─── ASYNC INIT: load GLB frames ─── */
  async load(color = "#ffffff") {
    this.frames = await loadFrames(color);
    this.frames.forEach((f, i) => {
      f.visible = i === 0;
      this.modelGroup.add(f);
    });
    this.loaded = true;
  }

  /* ─── POSITION getter (physics body center) ─── */
  get position() { return this.body.position; }

  /* ─── YAW getter (player body orientation) ─── */
  get yaw() { return this.body.rotation.y; }

  /* ─── CURRENT ANIM FRAME getter ─── */
  get animFrame() { return this.currentFrame; }

  /* ─── SHOW FRAME ─── */
  _showFrame(index) {
    if (!this.loaded || this.frames.length === 0) return;
    const next = index % this.frames.length;
    if (this.frames[this.currentFrame]) this.frames[this.currentFrame].visible = false;
    if (this.frames[next])             this.frames[next].visible = true;
    this.currentFrame = next;
  }

  /* ─── SYNC VISUAL MODEL to physics body ─── */
  _syncModel(bodyRotationY) {
    this.modelGroup.position.copy(this.body.position);
    this.modelGroup.position.y += MODEL_Y_OFFSET;
    this.modelGroup.rotation.y = bodyRotationY - Math.PI / 2;
  }

  /* ─── ANIMATE (advance frames based on isMoving) ─── */
  _animate(isMoving) {
    if (!this.loaded) return;
    if (isMoving) {
      this.frameTimer += 1 / 60;
      if (this.frameTimer >= FRAME_DURATION) {
        this.frameTimer = 0;
        this._showFrame((this.currentFrame + 1) % this.frames.length);
      }
    } else {
      this._showFrame(0);
      this.frameTimer = 0;
    }
  }

  /* ═══════════════════════════════
     UPDATE LOCAL (called every frame with input)
  ════════════════════════════════ */
  updateLocal(input) {
    const yaw     = getYaw();
    const forward = new THREE.Vector3(Math.sin(yaw), 0,  Math.cos(yaw));
    const right   = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
    const mv      = input.input.moveDir;

    /* ─── SPEED ─── */
    if      (mv.v < 0) this.speedForward += ACCELERATION;
    else if (mv.v > 0) this.speedForward -= ACCELERATION;
    else               this.speedForward *= 0.9;

    if      (mv.h < 0) this.speedSide += ACCELERATION;
    else if (mv.h > 0) this.speedSide -= ACCELERATION;
    else               this.speedSide *= 0.9;

    this.speedForward = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, this.speedForward));
    this.speedSide    = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, this.speedSide));

    const isMoving = Math.abs(this.speedForward) > 0.01 || Math.abs(this.speedSide) > 0.01;

    /* ─── HORIZONTAL MOVEMENT + WALL COLLISION ─── */
    this.body.position.addScaledVector(forward, this.speedForward);
    this.body.position.addScaledVector(right,   this.speedSide);
    if (collisionMeshes.length > 0) resolveWalls(this.body.position);

    /* ─── ROTATION ─── */
    const move = forward.clone().multiplyScalar(this.speedForward)
                        .addScaledVector(right, this.speedSide);
    if (move.lengthSq() > 0.0001) {
      const target = Math.atan2(move.x, move.z);
      let diff = target - this.body.rotation.y;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      this.body.rotation.y += diff * 0.15;
    }

    /* ─── JUMP ─── */
    if (input.input.jumpPressed && this.isGrounded) {
      this.velocityY  = JUMP_FORCE;
      this.isGrounded = false;
    }

    /* ─── GRAVITY + FLOOR + CEILING ─── */
    this.velocityY += GRAVITY;
    this.body.position.y += this.velocityY;

    if (collisionMeshes.length > 0) {
      const groundY = getGroundY(this.body.position);
      if (groundY !== null) {
        const floorY = groundY + HALF_HEIGHT;
        if (this.body.position.y <= floorY) {
          this.body.position.y = floorY;
          this.velocityY  = 0;
          this.isGrounded = true;
        } else {
          this.isGrounded = false;
        }
      } else {
        this.isGrounded = false;
        if (this.body.position.y < -50) {
          this.body.position.set(0, 5, 0);
          this.velocityY = 0;
        }
      }

      const ceilY = getCeilingY(this.body.position);
      if (ceilY !== null) {
        this.body.position.y = ceilY - HALF_HEIGHT - RADIUS;
        if (this.velocityY > 0) this.velocityY = 0;
      }
    } else {
      if (this.body.position.y <= HALF_HEIGHT) {
        this.body.position.y = HALF_HEIGHT;
        this.velocityY  = 0;
        this.isGrounded = true;
      }
    }

    /* ─── SYNC VISUAL + ANIMATE ─── */
    this._syncModel(this.body.rotation.y);
    this._animate(isMoving);
  }

  /* ═══════════════════════════════
     UPDATE REMOTE (called every frame with server data)
  ════════════════════════════════ */
  updateRemote(serverData) {
    const newPosition = new THREE.Vector3(serverData.x, serverData.y, serverData.z);
    const moved = newPosition.distanceToSquared(this.lastRemotePosition) > 0.0001;
    this.lastRemotePosition.copy(newPosition);

    this.body.position.copy(newPosition);
    this.body.rotation.y = serverData.yaw;
    this._syncModel(serverData.yaw);

    const animFrame = typeof serverData.animFrame === "number" ? serverData.animFrame : this.currentFrame;
    if (animFrame !== this.currentFrame) this._showFrame(animFrame);

    if (moved) this._animate(true);
  }

  /* ─── DESTROY ─── */
  destroy() {
    this.scene.remove(this.body);
    this.scene.remove(this.modelGroup);
  }
}