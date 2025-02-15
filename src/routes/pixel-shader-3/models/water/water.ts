import * as THREE from "three";

import waterVert from "./water.vert";
import waterFrag from "./water.frag";
import { DEPTHLESS_LAYER } from "../../constants";
import { RenderedTextures } from "../../RenderedTextures";
import { createToonMaterial } from "../../materials/toon/createToonMaterial";

export function addWater(camera: THREE.Camera) {
  // const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });
  const wallMaterial = createToonMaterial(new THREE.Color(0xaaaaaa));
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

  const resolution = new THREE.Vector4(
    window.innerWidth / 3,
    window.innerHeight / 3,
    3 / window.innerWidth,
    3 / window.innerHeight
  );

  const waterMaterial = new THREE.ShaderMaterial({
    vertexShader: waterVert,
    fragmentShader: waterFrag,
    uniforms: {
      ...THREE.UniformsLib.lights,
      tRealDiffuse: { value: null },
      tRealDepth: { value: null },
      tDisplacement: { value: displacementTexture },
      tDiffuse: { value: null },
      tDepth: { value: null },
      tNormal: { value: null },
      tGrassDiffuse: { value: null },
      tGrassDepth: { value: null },
      uNear: { value: (camera as THREE.PerspectiveCamera).near },
      uFar: { value: (camera as THREE.PerspectiveCamera).far },
      uTime: { value: 0 },
      uDisplacementAmount: { value: 0.2 },
      uDirectionalLight: {
        value: new THREE.Vector3(5, 4, 3),
      },
      uInverseViewMatrix: { value: null },
      uTextureMatrix: { value: new THREE.Matrix4() },
      uResolution: {
        value: resolution,
      },
      uGlossiness: { value: 5 },
    },
    lights: true,
  });
  const waterGeometry = new THREE.PlaneGeometry(5, 5, 20, 20);

  const water = new THREE.Mesh(waterGeometry, waterMaterial);
  water.layers.set(DEPTHLESS_LAYER);
  water.rotation.x = -(Math.PI * 90) / 180;

  water.attach(wall1);
  water.attach(wall2);
  water.attach(wall3);
  water.attach(wall4);
  water.attach(floor);
  water.position.set(0, 0.5, 0);

  // Reflection
  const clipBias = 0;

  const reflectorPlane = new THREE.Plane();
  const normal = new THREE.Vector3();
  const reflectorWorldPosition = new THREE.Vector3();
  const cameraWorldPosition = new THREE.Vector3();
  const rotationMatrix = new THREE.Matrix4();
  const lookAtPosition = new THREE.Vector3(0, 0, -1);
  const clipPlane = new THREE.Vector4();

  const view = new THREE.Vector3();
  const target = new THREE.Vector3();
  const q = new THREE.Vector4();

  const textureMatrix = new THREE.Matrix4();
  const virtualCamera = new THREE.PerspectiveCamera();
  virtualCamera.layers.enableAll();

  waterMaterial.uniforms["uTextureMatrix"].value = textureMatrix;
  waterMaterial.uniforms["uInverseViewMatrix"].value =
    virtualCamera.matrixWorld;

  let reflectorRenderedTextures: RenderedTextures | null = null;

  water.onBeforeRender = function (renderer, scene, camera) {
    reflectorWorldPosition.setFromMatrixPosition(water.matrixWorld);
    cameraWorldPosition.setFromMatrixPosition(camera.matrixWorld);

    rotationMatrix.extractRotation(water.matrixWorld);

    normal.set(0, 0, 1);
    normal.applyMatrix4(rotationMatrix);

    view.subVectors(reflectorWorldPosition, cameraWorldPosition);

    // Avoid rendering when reflector is facing away
    if (view.dot(normal) > 0) return;

    view.reflect(normal).negate();
    view.add(reflectorWorldPosition);

    rotationMatrix.extractRotation(camera.matrixWorld);

    lookAtPosition.set(0, 0, -1);
    lookAtPosition.applyMatrix4(rotationMatrix);
    lookAtPosition.add(cameraWorldPosition);

    target.subVectors(reflectorWorldPosition, lookAtPosition);
    target.reflect(normal).negate();
    target.add(reflectorWorldPosition);

    virtualCamera.position.copy(view);
    virtualCamera.up.set(0, 1, 0);
    virtualCamera.up.applyMatrix4(rotationMatrix);
    virtualCamera.up.reflect(normal);
    virtualCamera.lookAt(target);

    virtualCamera.far = (camera as THREE.PerspectiveCamera).far; // Used in WebGLBackground

    virtualCamera.updateMatrixWorld();
    virtualCamera.projectionMatrix.copy(camera.projectionMatrix);

    // Update the texture matrix
    textureMatrix.set(
      0.5,
      0.0,
      0.0,
      0.5,
      0.0,
      0.5,
      0.0,
      0.5,
      0.0,
      0.0,
      0.5,
      0.5,
      0.0,
      0.0,
      0.0,
      1.0
    );
    textureMatrix.multiply(virtualCamera.projectionMatrix);
    textureMatrix.multiply(virtualCamera.matrixWorldInverse);
    textureMatrix.multiply(water.matrixWorld);

    // Now update projection matrix with new clip plane, implementing code from: http://www.terathon.com/code/oblique.html
    // Paper explaining this technique: http://www.terathon.com/lengyel/Lengyel-Oblique.pdf
    reflectorPlane.setFromNormalAndCoplanarPoint(
      normal,
      reflectorWorldPosition
    );
    reflectorPlane.applyMatrix4(virtualCamera.matrixWorldInverse);

    clipPlane.set(
      reflectorPlane.normal.x,
      reflectorPlane.normal.y,
      reflectorPlane.normal.z,
      reflectorPlane.constant
    );

    const projectionMatrix = virtualCamera.projectionMatrix;

    q.x =
      (Math.sign(clipPlane.x) + projectionMatrix.elements[8]) /
      projectionMatrix.elements[0];
    q.y =
      (Math.sign(clipPlane.y) + projectionMatrix.elements[9]) /
      projectionMatrix.elements[5];
    q.z = -1.0;
    q.w = (1.0 + projectionMatrix.elements[10]) / projectionMatrix.elements[14];

    // Calculate the scaled plane vector
    clipPlane.multiplyScalar(2.0 / clipPlane.dot(q));

    // Replacing the third row of the projection matrix
    projectionMatrix.elements[2] = clipPlane.x;
    projectionMatrix.elements[6] = clipPlane.y;
    projectionMatrix.elements[10] = clipPlane.z + 1.0 - clipBias;
    projectionMatrix.elements[14] = clipPlane.w;

    water.visible = false;

    if (reflectorRenderedTextures === null) {
      reflectorRenderedTextures = new RenderedTextures(
        renderer,
        scene,
        virtualCamera,
        new THREE.OrthographicCamera(),
        new THREE.Vector2(resolution.x, resolution.y)
      );
    }

    reflectorRenderedTextures.resetTextures();

    // Render
    const currentRenderTarget = renderer.getRenderTarget();

    const currentXrEnabled = renderer.xr.enabled;
    const currentShadowAutoUpdate = renderer.shadowMap.autoUpdate;

    renderer.xr.enabled = false; // Avoid camera modification
    renderer.shadowMap.autoUpdate = false; // Avoid re-computing shadows

    waterMaterial.uniforms["tDiffuse"].value =
      reflectorRenderedTextures.diffuseDepthlessTexture;
    waterMaterial.uniforms["tDepth"].value =
      reflectorRenderedTextures.depthDepthlessTexture;
    waterMaterial.uniforms["tNormal"].value =
      reflectorRenderedTextures.normalDepthlessTexture;
    waterMaterial.uniforms["tGrassDiffuse"].value =
      reflectorRenderedTextures.diffuseTexture;
    waterMaterial.uniforms["tGrassDepth"].value =
      reflectorRenderedTextures.depthTexture;

    renderer.xr.enabled = currentXrEnabled;
    renderer.shadowMap.autoUpdate = currentShadowAutoUpdate;

    renderer.setRenderTarget(currentRenderTarget);

    // TODO: Restore viewport

    // const viewport = (camera as THREE.PerspectiveCamera).viewport;

    // if (viewport !== undefined) {
    //   renderer.state.viewport(viewport);
    // }

    water.visible = true;
  };

  return water;
}
