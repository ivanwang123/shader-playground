import type { Options } from ".";
import * as THREE from "three";
import { createToonMaterial } from "../materials/toon/createToonMaterial";

export function addCube(options?: Options) {
  const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
  const cubeMaterial = new THREE.MeshStandardMaterial({
    color: options?.color || 0xff773d,
  });
  // const cubeMaterial = createToonMaterial(new THREE.Color(0xff773d));

  const cube = new THREE.Mesh<any, any, any>(cubeGeometry, cubeMaterial);
  if (options?.position) {
    cube.position.copy(options.position);
  } else {
    cube.position.set(0, 0.5, 0);
  }
  cube.castShadow = true;

  return cube;
}
