import * as THREE from "three";
import textureVert from "./texture.vert";
import textureFrag from "./texture.frag";
import pixelVert from "../../postprocess/pixel/pixel.vert";
import pixelFrag from "../../postprocess/pixel/pixel.frag";
import { DEPTHLESS_LAYER } from "../../constants";

export function addTexture(resolution: THREE.Vector2, camera: THREE.Camera) {
  const textureGeometry = new THREE.PlaneGeometry(10, 10);
  // TODO: Infinite loop? Create separate camera and renderer behind plane
  const textureMaterial = new THREE.ShaderMaterial({
    vertexShader: textureVert,
    fragmentShader: textureFrag,
    uniforms: {
      tTexture: { value: null },
      uTextureMatrix: { value: new THREE.Matrix4() },
      uResolution: { value: resolution },
    },
  });
  // new THREE.ShaderMaterial({
  //   vertexShader: textureVert,
  //   fragmentShader: textureFrag,
  //   uniforms: {
  //     tDiffuse: { value: null },
  //     tDepth: { value: null },
  //     tNormal: { value: null },
  //     tGrassDiffuse: { value: null },
  //     tGrassDepth: { value: null },
  //     // TODO: Get directional light direction
  //     uDirectionalLight: {
  //       value: new THREE.Vector3(5, 4, 3),
  //     },
  //     uInverseProjectionMatrix: {
  //       value: camera.projectionMatrixInverse,
  //     },
  //     uInverseViewMatrix: {
  //       value: camera.matrixWorld,
  //     },
  //     uResolution: {
  //       value: new THREE.Vector4(
  //         resolution.x,
  //         resolution.y,
  //         1 / resolution.x,
  //         1 / resolution.y
  //       ),
  //     },
  //   },
  // });

  const texture = new THREE.Mesh(textureGeometry, textureMaterial);
  texture.position.set(0, 5, -8);

  return texture;
}
