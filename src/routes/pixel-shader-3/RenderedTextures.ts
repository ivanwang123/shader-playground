import * as THREE from "three";
import { DEPTHLESS_LAYER, GROUND_LAYER } from "./constants";

export class RenderedTextures {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.Camera;
  topdownCamera: THREE.Camera;
  resolution: THREE.Vector2;

  diffuseAndDepthRenderTarget: THREE.WebGLRenderTarget;
  // depthRenderTarget: THREE.WebGLRenderTarget;
  diffuseAndDepthDepthlessRenderTarget: THREE.WebGLRenderTarget;
  // depthDepthlessRenderTarget: THREE.WebGLRenderTarget;
  normalDepthlessRenderTarget: THREE.WebGLRenderTarget;
  groundAndDepthRenderTarget: THREE.WebGLRenderTarget;
  // groundDepthRenderTarget: THREE.WebGLRenderTarget;

  // diffuseTexture: THREE.Texture;
  // depthTexture: THREE.DepthTexture;
  // diffuseDepthlessTexture: THREE.Texture;
  // depthDepthlessTexture: THREE.DepthTexture;
  // normalDepthlessTexture: THREE.Texture;
  // groundTexture: THREE.Texture;
  // groundDepthTexture: THREE.DepthTexture;

  normalMaterial: THREE.MeshNormalMaterial;

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

    this.diffuseAndDepthRenderTarget = this.createRenderTarget(
      resolution.x,
      resolution.y,
      true
    );

    this.diffuseAndDepthDepthlessRenderTarget = this.createRenderTarget(
      resolution.x,
      resolution.y,
      true
    );

    this.normalDepthlessRenderTarget = this.createRenderTarget(
      resolution.x,
      resolution.y,
      true
    );

    this.groundAndDepthRenderTarget = this.createRenderTarget(
      resolution.x,
      resolution.y,
      true
    );

    this.normalMaterial = new THREE.MeshNormalMaterial();
  }

  renderDiffuseAndDepth() {
    this.renderer.setRenderTarget(this.diffuseAndDepthRenderTarget);
    this.renderer.render(this.scene, this.camera);

    return this.diffuseAndDepthRenderTarget;
  }

  renderDiffuseAndDepthDepthless() {
    this.camera.layers.disable(DEPTHLESS_LAYER);
    this.renderer.setRenderTarget(this.diffuseAndDepthDepthlessRenderTarget);
    this.renderer.render(this.scene, this.camera);
    this.camera.layers.enable(DEPTHLESS_LAYER);

    return this.diffuseAndDepthDepthlessRenderTarget;
  }

  renderNormalDepthless() {
    this.camera.layers.disable(DEPTHLESS_LAYER);
    const prevOverrideMaterial = this.scene.overrideMaterial;
    this.renderer.setRenderTarget(this.normalDepthlessRenderTarget);
    this.scene.overrideMaterial = this.normalMaterial;
    this.renderer.render(this.scene, this.camera);
    this.scene.overrideMaterial = prevOverrideMaterial;
    this.camera.layers.enable(DEPTHLESS_LAYER);

    return this.normalDepthlessRenderTarget;
  }

  renderGroundAndDepthTexture() {
    const groundLayer = new THREE.Layers();
    groundLayer.set(GROUND_LAYER);

    this.scene.children.forEach((child) => {
      if (child instanceof THREE.Mesh && !child.layers.test(groundLayer)) {
        child.material.colorWrite = false;
        child.material.depthWrite = false;
      }
    });

    this.renderer.setRenderTarget(this.groundAndDepthRenderTarget);
    this.renderer.render(this.scene, this.topdownCamera);

    this.scene.children.forEach((child) => {
      if (child instanceof THREE.Mesh && !child.layers.test(groundLayer)) {
        child.material.colorWrite = true;
        child.material.depthWrite = true;
      }
    });

    return this.groundAndDepthRenderTarget;
  }

  private createRenderTarget(
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
}
