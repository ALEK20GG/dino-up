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

    if (socket.readyState === WebSocket.OPEN && myId) {

        socket.send(JSON.stringify({
          type: "update",
          x: player.position.x,
          y: player.position.y,
          z: player.position.z,
          yaw: yaw
        }));
        
    }
    
    for (let id in otherPlayers) {
    
    if (id === myId) continue;
    
    let p = otherPlayers[id];
    
    if (!meshes[id]) {
    
        const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1,1,1),
        new THREE.MeshStandardMaterial({ color: 0xff0000 })
        );
    
        scene.add(mesh);
        meshes[id] = mesh;
    }
    
    meshes[id].position.set(p.x, p.y, p.z);
    meshes[id].rotation.y = p.yaw;
    
    }
}
animate();