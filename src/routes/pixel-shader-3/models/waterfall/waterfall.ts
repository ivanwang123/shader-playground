import waterfallFrag from "./waterfall.frag";
import waterfallVert from "./waterfall.vert";
import * as THREE from "three";

type Options = {
  position: THREE.Vector3;
};

export function addWaterfall(options?: Options) {
  // Load noise texture
  const noiseTexture = new THREE.TextureLoader().load(
    "/textures/NoiseTexture.png"
  );
  noiseTexture.flipY = false;
  noiseTexture.wrapS = THREE.RepeatWrapping;
  noiseTexture.wrapT = THREE.RepeatWrapping;

  // Load displacement texture
  const displacementTexture = new THREE.TextureLoader().load(
    "/textures/DisplacementTexture.png"
  );
  displacementTexture.flipY = false;
  displacementTexture.wrapS = THREE.RepeatWrapping;
  displacementTexture.wrapT = THREE.RepeatWrapping;

  const waterfallGeometry = new THREE.CylinderGeometry(1, 1, 10);
  const waterfallMaterial = new THREE.ShaderMaterial({
    vertexShader: waterfallVert,
    fragmentShader: waterfallFrag,
    uniforms: {
      tNoise: { value: noiseTexture },
      tDisplacement: { value: displacementTexture },
      uTime: { value: 0 },
      uSpeed: { value: 0.25 },
      uDisplacementAmount: { value: 0.02 },
      uBottomFoamThreshold: { value: 0.05 },
      uTopLightColor: {
        value: new THREE.Vector3(140, 227, 250).divideScalar(255),
      },
      uTopDarkColor: { value: new THREE.Vector3(24, 40, 44).divideScalar(255) },
      uBottomLightColor: {
        value: new THREE.Vector3(201, 234, 243).divideScalar(255),
      },
      uBottomDarkColor: {
        value: new THREE.Vector3(24, 28, 29).divideScalar(255),
      },
    },
  });

  const waterfall = new THREE.Mesh(waterfallGeometry, waterfallMaterial);
  if (options?.position) {
    waterfall.position.copy(options.position);
  } else {
    waterfall.position.set(0, 5.0, 0);
  }

  return waterfall;
}
