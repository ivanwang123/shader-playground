import * as THREE from "three";
import type { Options } from ".";
import { createToonMaterial } from "../materials/toon/createToonMaterial";

export function addSphere(options?: Options) {
  const sphereGeometry = new THREE.SphereGeometry(0.5);
  const sphereMaterial = new THREE.MeshStandardMaterial({
    color: options?.color || 0x777da7,
  });
  // const sphereMaterial = createToonMaterial(new THREE.Color(0x777da7));

  const sphere = new THREE.Mesh<any, any, any>(sphereGeometry, sphereMaterial);
  if (options?.position) {
    sphere.position.copy(options.position);
  } else {
    sphere.position.set(0, 0.5, 0);
  }
  sphere.castShadow = true;

  return sphere;
}
