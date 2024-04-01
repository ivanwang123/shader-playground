import * as THREE from "three";
import type { Options } from ".";
import { GROUND_LAYER } from "../constants";
import { createNoise2D } from "simplex-noise";
import { createToonMaterial } from "../materials/toon/createToonMaterial";

export function addGround(options?: Options) {
  const noise2D = createNoise2D();

  const groundGeometry = new THREE.PlaneGeometry(20, 20, 100, 100);
  const groundMaterial = new THREE.MeshStandardMaterial({
    color: options?.color || 0xceb1be,
  });
  // const groundMaterial = createToonMaterial(new THREE.Color(0xceb1be));

  const ground = new THREE.Mesh<any, any, any>(groundGeometry, groundMaterial);
  if (options?.position) {
    ground.position.copy(options.position);
  }
  ground.rotateX(THREE.MathUtils.degToRad(-90));
  ground.updateMatrixWorld();
  ground.receiveShadow = true;
  ground.layers.set(GROUND_LAYER);

  let peak = 0;
  let smoothing = 20;
  let vertices = ground.geometry.attributes.position.array;
  for (let i = 0; i <= vertices.length; i += 3) {
    vertices[i + 2] =
      peak * noise2D(vertices[i] / smoothing, vertices[i + 1] / smoothing);
  }
  ground.geometry.computeVertexNormals();

  return ground;
}
