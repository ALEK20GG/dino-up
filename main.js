import { scene, camera, renderer, player } from "./scene.js";
import Input from "./input.js";

import { move } from "./movement.js";
import { updateCameraRotation, updateCameraPosition } from "./camera.js";

const input = new Input();

/* POINTER LOCK */
document.body.addEventListener("click", () => {
  document.body.requestPointerLock();
});

let mouseX = 0;
let mouseY = 0;

document.addEventListener("mousemove", e => {
  if (document.pointerLockElement === document.body) {
    mouseX = e.movementX;
    mouseY = e.movementY;
  }
});

function animate() {
    requestAnimationFrame(animate);
  
    input.update();
  
    updateCameraRotation(input, mouseX, mouseY);
  
    // reset mouse delta
    mouseX = 0;
    mouseY = 0;
  
    move(input, player);
  
    updateCameraPosition(camera, player);
  
    renderer.render(scene, camera);
}

animate();