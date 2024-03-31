import * as THREE from "three";
import textureVert from "./texture.vert";
import textureFrag from "./texture.frag";

export function addTexture(resolution: THREE.Vector2) {
  const textureGeometry = new THREE.PlaneGeometry(10, 10);
  const textureMaterial = new THREE.ShaderMaterial({
    vertexShader: textureVert,
    fragmentShader: textureFrag,
    uniforms: {
      tTexture: { value: null },
      uResolution: { value: resolution },
    },
  });

  const texture = new THREE.Mesh(textureGeometry, textureMaterial);
  texture.position.set(0, 5, -10);

  return texture;
}
