import * as THREE from "three";
import { DEPTHLESS_LAYER, GROUND_LAYER } from "./constants";

type Params = {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.Camera;
  resolution: THREE.Vector2;
};

export function createDiffuseRenderTarget(params: Params) {
  const diffuseRenderTarget = createRenderTarget(
    params.resolution.x,
    params.resolution.y,
    true
  );
  params.renderer.setRenderTarget(diffuseRenderTarget);
  params.renderer.render(params.scene, params.camera);

  return diffuseRenderTarget;
}

export function createDiffuseDepthlessRenderTarget(params: Params) {
  const diffuseDepthlessRenderTarget = createRenderTarget(
    params.resolution.x,
    params.resolution.y,
    false
  );
  params.camera.layers.disable(DEPTHLESS_LAYER);
  params.renderer.setRenderTarget(diffuseDepthlessRenderTarget);
  params.renderer.render(params.scene, params.camera);
  params.camera.layers.enable(DEPTHLESS_LAYER);

  return diffuseDepthlessRenderTarget;
}

export function createGroundRenderTarget(params: Params) {
  const groundRenderTarget = createRenderTarget(
    params.resolution.x,
    params.resolution.y,
    true
  );

  const groundLayer = new THREE.Layers();
  groundLayer.set(GROUND_LAYER);
  params.scene.children.forEach((child) => {
    if (child instanceof THREE.Mesh && !child.layers.test(groundLayer)) {
      child.material.colorWrite = false;
      child.material.depthWrite = false;
    }
  });
  params.renderer.setRenderTarget(groundRenderTarget);
  params.renderer.render(params.scene, params.camera);
  params.scene.children.forEach((child) => {
    if (child instanceof THREE.Mesh && !child.layers.test(groundLayer)) {
      child.material.colorWrite = true;
      child.material.depthWrite = true;
    }

    // if (child instanceof THREE.InstancedMesh) {
    //   child.material.uniforms["tGround"] = {
    //     value: groundRenderTarget.texture,
    //   };
    //   child.material.uniforms["tGroundDepth"] = {
    //     value: groundRenderTarget.depthTexture,
    //   };
    // }
  });

  return groundRenderTarget;
}

export function createNormalAndDepthRenderTarget(params: Params) {
  const normalRenderTarget = createRenderTarget(
    params.resolution.x,
    params.resolution.y,
    true
  );
  const normalMaterial = new THREE.MeshNormalMaterial();

  params.camera.layers.disable(DEPTHLESS_LAYER);
  const prevOverrideMaterial = params.scene.overrideMaterial;
  params.renderer.setRenderTarget(normalRenderTarget);
  params.scene.overrideMaterial = normalMaterial;
  params.renderer.render(params.scene, params.camera);
  params.scene.overrideMaterial = prevOverrideMaterial;
  params.camera.layers.enable(DEPTHLESS_LAYER);

  return normalRenderTarget;
}

export function createRenderTarget(
  width: number,
  height: number,
  depthTexture: boolean
) {
  const renderTarget = new THREE.WebGLRenderTarget(
    width,
    height,
    depthTexture
      ? {
          depthTexture: new THREE.DepthTexture(width, height),
          depthBuffer: true,
        }
      : undefined
  );
  renderTarget.texture.format = THREE.RGBAFormat;
  renderTarget.texture.minFilter = THREE.NearestFilter;
  renderTarget.texture.magFilter = THREE.NearestFilter;
  renderTarget.texture.generateMipmaps = false;
  renderTarget.stencilBuffer = false;

  return renderTarget;
}
