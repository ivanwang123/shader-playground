import * as THREE from "three";

import toonVert from "./toon.vert";
import toonTextureFrag from "./toonTexture.frag";
import toonColorFrag from "./toonColor.frag";

export function createToonMaterial(texture: THREE.Texture | THREE.Color) {
  let isTexture = true;
  if (texture instanceof THREE.Color) {
    isTexture = false;
  }

  let fragmentShader = toonTextureFrag;

  let uniforms: { [uniform: string]: THREE.IUniform<any> } = {
    ...THREE.UniformsLib.lights,
    uGlossiness: { value: 5 },
  };

  if (isTexture) {
    fragmentShader = toonTextureFrag;
    uniforms["uTexture"] = { value: texture };
  } else {
    fragmentShader = toonColorFrag;
    uniforms["uColor"] = { value: texture };
  }

  return new THREE.ShaderMaterial({
    vertexShader: toonVert,
    fragmentShader,
    uniforms,
    lights: true,
  });
}

export function useToonMaterial(meshes: THREE.Mesh<any, any, any>[]) {
  meshes.forEach((mesh) => {
    let material: THREE.Material | null = null;
    if (mesh.material.name.includes("Outline")) {
      material = new THREE.MeshBasicMaterial({
        color: mesh.userData["color"] || new THREE.Color(0x000000),
      });
    } else if (mesh.userData["texture"]) {
      material = createToonMaterial(mesh.userData["texture"]);
    } else if (mesh.userData["color"]) {
      material = createToonMaterial(mesh.userData["color"]);
    } else {
      material = createToonMaterial(new THREE.Color(0xffffff));
    }
    mesh.material = material;
  });
}
