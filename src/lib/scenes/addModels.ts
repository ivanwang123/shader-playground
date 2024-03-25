import { createToonMaterial } from "$lib/materials/toon/createToonMaterial";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/Addons.js";

export function addGround(scene: THREE.Scene) {
  const groundGeometry = new THREE.PlaneGeometry(10, 10);
  // const groundMaterial = new THREE.MeshStandardMaterial({ color: 0xceb1be });
  const groundMaterial = createToonMaterial(new THREE.Color(0xceb1be));
  const ground = new THREE.Mesh<any, any, any>(groundGeometry, groundMaterial);
  ground.receiveShadow = true;
  ground.rotateX(THREE.MathUtils.degToRad(-90));
  ground.layers.set(1);
  scene.add(ground);
}

let numModels = 0;

export async function addMonkey(scene: THREE.Scene) {
  const monkeyTexture = new THREE.TextureLoader().load(
    "/textures/MonkeyTexture.png"
  );
  monkeyTexture.flipY = false;
  monkeyTexture.colorSpace = THREE.SRGBColorSpace;
  const monkeyMaterial = createToonMaterial(monkeyTexture);

  let monkey = await new GLTFLoader().loadAsync("/models/Monkey.glb");
  monkey.scene.position.set(1, 1, 0);

  monkey.scene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      // child.material = new THREE.MeshStandardMaterial({
      //   color: child.material.color,
      // });
      // texture = texture.convertLinearToSRGB();
      child.material = monkeyMaterial;
      // child.material = createToonMaterial(child.material.color);

      child.castShadow = true;
    }
  });

  scene.add(monkey.scene);
  numModels++;

  return monkey;
}

export function addCube(scene: THREE.Scene, color?: THREE.ColorRepresentation) {
  const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
  // const cubeMaterial = new THREE.MeshStandardMaterial({
  //   color: color || 0xff773d,
  // });
  const cubeMaterial = createToonMaterial(new THREE.Color(0xff773d));
  // cubeMaterial.colorWrite = false;
  // cubeMaterial.depthWrite = false;
  const cube = new THREE.Mesh<any, any, any>(cubeGeometry, cubeMaterial);
  cube.position.x = calcModelPosition();
  cube.position.y = 0.5;
  cube.castShadow = true;

  scene.add(cube);
  numModels++;

  return cube;
}

export function addSphere(
  scene: THREE.Scene,
  color?: THREE.ColorRepresentation
) {
  const sphereGeometry = new THREE.SphereGeometry(0.5);
  // const sphereMaterial = new THREE.MeshStandardMaterial({
  //   color: color || 0x777da7,
  // });
  const sphereMaterial = createToonMaterial(new THREE.Color(color || 0x777da7));
  // sphereMaterial.colorWrite = false;
  // sphereMaterial.depthWrite = false;
  const sphere = new THREE.Mesh<any, any, any>(sphereGeometry, sphereMaterial);
  sphere.position.x = calcModelPosition();
  sphere.position.y = 0.5;
  sphere.castShadow = true;

  scene.add(sphere);
  numModels++;

  return sphere;
}

function calcModelPosition() {
  const dir = numModels % 2 === 0 ? -1 : 1;
  const xPos = dir * (Math.ceil(numModels / 2) * 2);
  return xPos;
}
