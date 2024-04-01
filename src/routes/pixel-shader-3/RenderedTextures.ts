import * as THREE from "three";
import { DEPTHLESS_LAYER, GROUND_LAYER } from "./constants";

export class RenderedTextures {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.Camera;
  topdownCamera: THREE.Camera;
  resolution: THREE.Vector2;

  // diffuseRenderTarget: THREE.RenderTarget;
  // depthRenderTarget: THREE.RenderTarget;
  // diffuseDepthlessRenderTarget: THREE.RenderTarget;
  // depthDepthlessRenderTarget: THREE.RenderTarget;
  // normalDepthlessRenderTarget: THREE.RenderTarget;
  // groundRenderTarget: THREE.RenderTarget;
  // groundDepthRenderTarget: THREE.RenderTarget;

  diffuseTexture: THREE.Texture;
  depthTexture: THREE.DepthTexture;
  diffuseDepthlessTexture: THREE.Texture;
  depthDepthlessTexture: THREE.DepthTexture;
  normalDepthlessTexture: THREE.Texture;
  groundTexture: THREE.Texture;
  groundDepthTexture: THREE.DepthTexture;

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    topdownCamera: THREE.OrthographicCamera,
    resolution: THREE.Vector2
  ) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.topdownCamera = topdownCamera;
    this.resolution = resolution;

    const emptyTexture = new THREE.Texture();
    const emptyDepthTexture = new THREE.DepthTexture(0, 0);

    this.diffuseTexture = emptyTexture;
    this.depthTexture = emptyDepthTexture;

    this.diffuseDepthlessTexture = emptyTexture;
    this.depthDepthlessTexture = emptyDepthTexture;
    this.normalDepthlessTexture = emptyTexture;

    this.groundTexture = emptyTexture;
    this.groundDepthTexture = emptyDepthTexture;

    this.renderTextures();
  }

  renderTextures() {
    const diffuseRenderTarget = this.createDiffuseRenderTarget();
    this.diffuseTexture = diffuseRenderTarget.texture;
    this.depthTexture = diffuseRenderTarget.depthTexture;

    this.diffuseDepthlessTexture =
      this.createDiffuseDepthlessRenderTarget().texture;

    const normalAndDepthRenderTarget = this.createNormalAndDepthRenderTarget();
    this.normalDepthlessTexture = normalAndDepthRenderTarget.texture;
    this.depthDepthlessTexture = normalAndDepthRenderTarget.depthTexture;

    const groundRenderTarget = this.createGroundRenderTarget();
    this.groundTexture = groundRenderTarget.texture;
    this.groundDepthTexture = groundRenderTarget.depthTexture;
  }

  createDiffuseRenderTarget() {
    const diffuseRenderTarget = this.createRenderTarget(
      this.resolution.x,
      this.resolution.y,
      true
    );
    this.renderer.setRenderTarget(diffuseRenderTarget);
    this.renderer.render(this.scene, this.camera);

    return diffuseRenderTarget;
  }

  createDiffuseDepthlessRenderTarget() {
    const diffuseDepthlessRenderTarget = this.createRenderTarget(
      this.resolution.x,
      this.resolution.y,
      false
    );
    this.camera.layers.disable(DEPTHLESS_LAYER);
    this.renderer.setRenderTarget(diffuseDepthlessRenderTarget);
    this.renderer.render(this.scene, this.camera);
    this.camera.layers.enable(DEPTHLESS_LAYER);

    return diffuseDepthlessRenderTarget;
  }

  createGroundRenderTarget() {
    const groundRenderTarget = this.createRenderTarget(
      this.resolution.x,
      this.resolution.y,
      true
    );

    const groundLayer = new THREE.Layers();
    groundLayer.set(GROUND_LAYER);
    this.scene.children.forEach((child) => {
      if (child instanceof THREE.Mesh && !child.layers.test(groundLayer)) {
        child.material.colorWrite = false;
        child.material.depthWrite = false;
      }
    });
    this.renderer.setRenderTarget(groundRenderTarget);
    this.renderer.render(this.scene, this.topdownCamera);
    this.scene.children.forEach((child) => {
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

  createNormalAndDepthRenderTarget() {
    const normalRenderTarget = this.createRenderTarget(
      this.resolution.x,
      this.resolution.y,
      true
    );
    const normalMaterial = new THREE.MeshNormalMaterial();

    this.camera.layers.disable(DEPTHLESS_LAYER);
    const prevOverrideMaterial = this.scene.overrideMaterial;
    this.renderer.setRenderTarget(normalRenderTarget);
    this.scene.overrideMaterial = normalMaterial;
    this.renderer.render(this.scene, this.camera);
    this.scene.overrideMaterial = prevOverrideMaterial;
    this.camera.layers.enable(DEPTHLESS_LAYER);

    return normalRenderTarget;
  }

  createRenderTarget(width: number, height: number, depthTexture: boolean) {
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
}
