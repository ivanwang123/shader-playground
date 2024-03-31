import * as THREE from "three";

import grassVert from "./grass.vert";
import grassFrag from "./grass.frag";
import { DEPTHLESS_LAYER } from "../../constants";

export function addGrass(topdownCamera: THREE.Camera) {
  // const grassGeometry = new THREE.PlaneGeometry(0.1, 0.5, 1, 4);
  // grassGeometry.rotateX((Math.PI * 90) / 180);
  const grassGeometry = new THREE.BoxGeometry(0.1, 0.5, 0.1);
  grassGeometry.translate(0, 0.2, 0);
  const grassMaterial = new THREE.ShaderMaterial({
    vertexShader: grassVert,
    fragmentShader: grassFrag,
    uniforms: {
      tGround: { value: null },
      tGroundDepth: { value: null },
      uFar: { value: (topdownCamera as THREE.OrthographicCamera).far },
      uTime: { value: 0 },
      uResolution: {
        value: new THREE.Vector2(
          (topdownCamera as THREE.OrthographicCamera).right -
            (topdownCamera as THREE.OrthographicCamera).left,
          (topdownCamera as THREE.OrthographicCamera).top -
            (topdownCamera as THREE.OrthographicCamera).bottom
        ),
      },
    },
  });

  const instanceCount = 5000;
  const instancedGrass = new THREE.InstancedMesh(
    grassGeometry,
    grassMaterial,
    instanceCount
  );
  instancedGrass.layers.set(DEPTHLESS_LAYER);

  const dummyGrass = new THREE.Object3D();
  for (let i = 0; i < instanceCount; i++) {
    dummyGrass.position.set(
      (Math.random() - 0.5) * 10,
      0,
      (Math.random() - 0.5) * 10
    );
    dummyGrass.scale.setScalar(0.5 + Math.random() * 0.5);
    dummyGrass.rotation.y = (Math.random() * Math.PI) / 5;
    dummyGrass.castShadow = true;
    dummyGrass.updateMatrix();
    instancedGrass.setMatrixAt(i, dummyGrass.matrix);
  }

  return instancedGrass;
}
