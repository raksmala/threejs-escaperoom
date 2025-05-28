import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import "./style.css";

let scene, camera, renderer, leftDoor, rightDoor, controls;
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let selectedDoor = null;

// DOM elements
const loadingOverlay = document.getElementById("loadingOverlay");
const roomOverlay = document.getElementById("roomOverlay");
const roomText = document.querySelector(".room-text");

// Animation targets
const doorAnimTargets = new WeakMap();
const ANIMATION_SPEED = 0.1; // Adjust for faster/slower animation

// Camera animation
const CAMERA_ANIMATION_SPEED = 0.08;
let cameraTargetPosition = new THREE.Vector3(0, 2, 5);
let cameraTargetLookAt = new THREE.Vector3(0, 1, 0);
let cameraAnimating = false;
let cameraAnimationCallback = null;

init();
animate();

function init() {
  // Scene setup
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f0f0);

  // Camera setup
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 2, 5);

  // Renderer setup
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  document.body.appendChild(renderer.domElement);

  // Controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(5, 5, 5);
  directionalLight.castShadow = true;
  scene.add(directionalLight);

  // Floor
  const floorGeometry = new THREE.PlaneGeometry(10, 10);
  const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // Load door models
  const loader = new GLTFLoader();

  // Load left door
  loader.load("/door.glb", (gltf) => {
    leftDoor = gltf.scene;
    leftDoor.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.userData.isLeftDoor = true;
      }
    });
    leftDoor.position.set(-2, 0, 0);
    leftDoor.rotation.y = Math.PI;
    scene.add(leftDoor);
  });

  // Load right door
  loader.load("/door.glb", (gltf) => {
    rightDoor = gltf.scene;
    rightDoor.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.userData.isRightDoor = true;
      }
    });
    rightDoor.position.set(2, 0, 0);
    rightDoor.rotation.y = Math.PI;
    scene.add(rightDoor);
  });

  // Add click event listener
  window.addEventListener("click", onMouseClick, false);

  // Handle window resize
  window.addEventListener("resize", onWindowResize, false);

  // Camera reset button
  const resetBtn = document.getElementById("resetCameraBtn");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      moveCameraTo(new THREE.Vector3(0, 2, 5), new THREE.Vector3(0, 1, 0));
      resetAllDoorsAnimTargets();
      hideOverlays();
    });
  }
}

function showLoadingOverlay() {
  loadingOverlay.style.display = "flex";
  roomOverlay.style.display = "none";
}

function showRoomOverlay(text) {
  loadingOverlay.style.display = "none";
  roomText.textContent = text;
  roomOverlay.style.display = "flex";
}

function hideOverlays() {
  loadingOverlay.style.display = "none";
  roomOverlay.style.display = "none";
}

function onMouseClick(event) {
  // Calculate mouse position in normalized device coordinates
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // Update the picking ray with the camera and mouse position
  raycaster.setFromCamera(mouse, camera);

  // Calculate objects intersecting the picking ray
  const intersects = raycaster.intersectObjects(scene.children, true);

  if (intersects.length > 0) {
    const clickedObject = intersects[0].object;
    let doorRoot = null;
    let roomName = "";

    // Find the root door object
    if (clickedObject.userData.isLeftDoor) {
      doorRoot = leftDoor;
      roomName = "Room Left";
      console.log("Left door clicked!");
    } else if (clickedObject.userData.isRightDoor) {
      doorRoot = rightDoor;
      roomName = "Room Right";
      console.log("Right door clicked!");
    }

    if (doorRoot) {
      selectedDoor = doorRoot;
      resetAllDoorsAnimTargets();
      setDoorChildrenAnimTarget(doorRoot);

      // Move camera to selected door
      const doorWorldPos = new THREE.Vector3();
      doorRoot.getWorldPosition(doorWorldPos);
      const camPos = doorWorldPos.clone().add(new THREE.Vector3(0, 1, 3));
      moveCameraTo(
        camPos,
        doorWorldPos.clone().add(new THREE.Vector3(0, 1, 0)),
        () => {
          // Show loading overlay after camera movement
          showLoadingOverlay();
          // Show room text after loading
          setTimeout(() => {
            showRoomOverlay(roomName);
          }, 1000);
        }
      );
    }
  }
}

function moveCameraTo(targetPos, targetLookAt, onComplete) {
  cameraTargetPosition.copy(targetPos);
  cameraTargetLookAt.copy(targetLookAt);
  cameraAnimating = true;
  // Store the callback
  if (onComplete) {
    cameraAnimationCallback = onComplete;
  }
}

function resetAllDoorsAnimTargets() {
  [leftDoor, rightDoor].forEach((door) => {
    if (!door) return;
    door.traverse((child) => {
      if (child.name === "Left" || child.name === "Right") {
        setAnimTarget(child, 0);
      }
    });
  });
}

function setDoorChildrenAnimTarget(doorRoot) {
  const degToRad = Math.PI / 180;
  let leftChild = null;
  let rightChild = null;
  doorRoot.traverse((child) => {
    if (child.name === "Left") leftChild = child;
    if (child.name === "Right") rightChild = child;
  });
  if (leftChild) {
    setAnimTarget(leftChild, 65 * degToRad);
  }
  if (rightChild) {
    setAnimTarget(rightChild, -65 * degToRad);
  }
}

function setAnimTarget(child, targetY) {
  if (!doorAnimTargets.has(child)) {
    doorAnimTargets.set(child, { targetY });
  } else {
    doorAnimTargets.get(child).targetY = targetY;
  }
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  animateDoors();
  animateCamera();
  renderer.render(scene, camera);
}

function animateDoors() {
  [leftDoor, rightDoor].forEach((door) => {
    if (!door) return;
    door.traverse((child) => {
      if (
        (child.name === "Left" || child.name === "Right") &&
        doorAnimTargets.has(child)
      ) {
        const { targetY } = doorAnimTargets.get(child);
        // Lerp current rotation.y to targetY
        child.rotation.y += (targetY - child.rotation.y) * ANIMATION_SPEED;
        // Snap to target if close
        if (Math.abs(child.rotation.y - targetY) < 0.001) {
          child.rotation.y = targetY;
        }
      }
    });
  });
}

function animateCamera() {
  if (!cameraAnimating) return;
  // Lerp camera position
  camera.position.lerp(cameraTargetPosition, CAMERA_ANIMATION_SPEED);
  // Lerp lookAt
  const currentLookAt = new THREE.Vector3();
  controls.target.lerp(cameraTargetLookAt, CAMERA_ANIMATION_SPEED);
  controls.update();
  // Stop animating if close
  if (
    camera.position.distanceTo(cameraTargetPosition) < 0.01 &&
    controls.target.distanceTo(cameraTargetLookAt) < 0.01
  ) {
    camera.position.copy(cameraTargetPosition);
    controls.target.copy(cameraTargetLookAt);
    cameraAnimating = false;
    // Execute callback if exists
    if (cameraAnimationCallback) {
      cameraAnimationCallback();
      cameraAnimationCallback = null;
    }
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
