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
    uArray: { value: [] },
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
