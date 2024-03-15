import { FullScreenQuad, Pass } from "three/examples/jsm/Addons.js";
import * as THREE from "three";

import pixel2Vert from "./pixel2.vert";
import pixel2Frag from "./pixel2.frag";

export default class PixelPass extends Pass {
  resolution: THREE.Vector2;
  scene: THREE.Scene;
  camera: THREE.Camera;
  fsQuad: FullScreenQuad;
  renderTarget: THREE.WebGLRenderTarget;

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

    this.renderTarget = this.createRenderTarget(resolution.x, resolution.y);
  }

  render(renderer: THREE.WebGLRenderer, writeBuffer: THREE.WebGLRenderTarget) {
    renderer.setRenderTarget(this.renderTarget);
    renderer.render(this.scene, this.camera);

    const uniforms = (this.fsQuad.material as THREE.ShaderMaterial).uniforms;
    uniforms.tDiffuse.value = this.renderTarget.texture;

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
      },
      vertexShader: pixel2Vert,
      fragmentShader: pixel2Frag,
    });
  }

  createRenderTarget(width: number, height: number) {
    const renderTarget = new THREE.WebGLRenderTarget(width, height);
    renderTarget.texture.format = THREE.RGBAFormat;
    renderTarget.texture.minFilter = THREE.NearestFilter;
    renderTarget.texture.magFilter = THREE.NearestFilter;
    renderTarget.texture.generateMipmaps = false;
    renderTarget.stencilBuffer = false;
    return renderTarget;
  }
}
