import * as THREE from "three";

import waterVert from "./water.vert";
import waterFrag from "./water.frag";
import { DEPTHLESS_LAYER } from "../../constants";

export function addWater(camera: THREE.Camera) {
  const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });
  const wallGeometry = new THREE.BoxGeometry(5, 1, 0.5);
  const wall1 = new THREE.Mesh(wallGeometry, wallMaterial);
  const wall2 = new THREE.Mesh(wallGeometry, wallMaterial);
  const wall3 = new THREE.Mesh(wallGeometry, wallMaterial);
  const wall4 = new THREE.Mesh(wallGeometry, wallMaterial);
  wall1.position.z -= 2.5;
  wall2.position.z += 2.5;
  wall3.position.x -= 2.5;
  wall4.position.x += 2.5;
  wall1.position.y -= 0.4;
  wall2.position.y -= 0.4;
  wall3.position.y -= 0.4;
  wall4.position.y -= 0.4;
  wall3.rotation.y = (Math.PI * 90) / 180;
  wall4.rotation.y = (Math.PI * 90) / 180;

  const floorGeometry = new THREE.PlaneGeometry(5, 5);
  const floor = new THREE.Mesh(floorGeometry, wallMaterial);
  floor.position.y = -0.9;
  floor.rotation.x = -(Math.PI * 90) / 180;

  const displacementTexture = new THREE.TextureLoader().load(
    "/textures/DisplacementTexture.png"
  );
  displacementTexture.flipY = false;
  displacementTexture.wrapS = THREE.RepeatWrapping;
  displacementTexture.wrapT = THREE.RepeatWrapping;

  const waterMaterial = new THREE.ShaderMaterial({
    vertexShader: waterVert,
    fragmentShader: waterFrag,
    uniforms: {
      tDiffuse: { value: null },
      tDepth: { value: null },
      tDisplacement: { value: displacementTexture },
      uNear: { value: (camera as THREE.PerspectiveCamera).near },
      uFar: { value: (camera as THREE.PerspectiveCamera).far },
      uTime: { value: 0 },
      uDisplacementAmount: { value: 0.2 },
      uResolution: {
        value: new THREE.Vector2(window.innerWidth / 3, window.innerHeight / 3),
      },
    },
  });
  const waterGeometry = new THREE.PlaneGeometry(5, 5);

  const water = new THREE.Mesh(waterGeometry, waterMaterial);
  water.layers.set(DEPTHLESS_LAYER);
  water.rotation.x = -(Math.PI * 90) / 180;

  water.attach(wall1);
  water.attach(wall2);
  water.attach(wall3);
  water.attach(wall4);
  water.attach(floor);
  water.position.set(7.5, 0.5, 0);
  water.position.set(0, 0.5, 0);

  return water;
}
