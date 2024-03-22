import { FullScreenQuad, Pass } from "three/examples/jsm/Addons.js";
import * as THREE from "three";

import pixel2Vert from "./pixel2.vert";
import pixel2Frag from "./pixel2.frag";
import pixel2SobelFrag from "./pixel2sobel.frag";
import pixel2RoystanFrag from "./pixel2roystan.frag";
import pixel2CrigzFrag from "./pixel2crigz.frag";

export default class PixelPass extends Pass {
  resolution: THREE.Vector2;
  scene: THREE.Scene;
  camera: THREE.Camera;
  fsQuad: FullScreenQuad;
  rgbRenderTarget: THREE.WebGLRenderTarget;
  normalRenderTarget: THREE.WebGLRenderTarget;
  normalMaterial: THREE.Material;

  constructor(
    resolution: THREE.Vector2,
    scene: THREE.Scene,
    camera: THREE.Camera
  ) {
    super();
    this.resolution = resolution;
    this.scene = scene;
    this.camera = camera;
    this.fsQuad = new FullScreenQuad(this.material());

    this.rgbRenderTarget = this.createRenderTarget(
      resolution.x,
      resolution.y,
      true
    );
    this.normalRenderTarget = this.createRenderTarget(
      resolution.x,
      resolution.y,
      false
    );

    this.normalMaterial = new THREE.MeshNormalMaterial();
  }

  render(renderer: THREE.WebGLRenderer, writeBuffer: THREE.WebGLRenderTarget) {
    renderer.setRenderTarget(this.rgbRenderTarget);
    renderer.render(this.scene, this.camera);

    const prevOverrideMaterial = this.scene.overrideMaterial;
    renderer.setRenderTarget(this.normalRenderTarget);
    this.scene.overrideMaterial = this.normalMaterial;
    renderer.render(this.scene, this.camera);
    this.scene.overrideMaterial = prevOverrideMaterial;

    const uniforms = (this.fsQuad.material as THREE.ShaderMaterial).uniforms;
    uniforms.tDiffuse.value = this.rgbRenderTarget.texture;
    uniforms.tDepth.value = this.rgbRenderTarget.depthTexture;
    uniforms.tNormal.value = this.normalRenderTarget.texture;

    if (this.renderToScreen) {
      renderer.setRenderTarget(null);
    } else {
      renderer.setRenderTarget(writeBuffer);
      if (this.clear) {
        renderer.clear();
      }
    }

    this.fsQuad.render(renderer);
  }

  material() {
    return new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        tDepth: { value: null },
        tNormal: { value: null },
        uDirectionalLight: {
          value: new THREE.Vector3(5, 4, 3),
        },
        uInverseProjectionMatrix: {
          value: this.camera.projectionMatrixInverse,
        },
        uInverseViewMatrix: {
          value: this.camera.matrixWorld,
        },
        uResolution: {
          value: new THREE.Vector4(
            this.resolution.x,
            this.resolution.y,
            1 / this.resolution.x,
            1 / this.resolution.y
          ),
        },
      },
      vertexShader: pixel2Vert,
      fragmentShader: pixel2CrigzFrag,
    });
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
