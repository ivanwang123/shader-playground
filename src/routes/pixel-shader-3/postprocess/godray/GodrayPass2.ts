import {
  FullScreenQuad,
  GodRaysCombineShader,
  GodRaysDepthMaskShader,
  GodRaysGenerateShader,
  Pass,
} from "three/examples/jsm/Addons.js";
import * as THREE from "three";
import type { RenderedTextures } from "../../RenderedTextures";

export class GodrayPass2 extends Pass {
  resolution: THREE.Vector2;
  camera: THREE.Camera;
  renderedTextures: RenderedTextures;
  fsQuad: FullScreenQuad;

  constructor(
    resolution: THREE.Vector2,
    camera: THREE.Camera,
    renderedTextures: RenderedTextures
  ) {
    super();

    this.resolution = resolution;
    this.camera = camera;
    this.renderedTextures = renderedTextures;
    this.fsQuad = new FullScreenQuad(this.material());
  }

  render(
    renderer: THREE.WebGLRenderer,
    writeBuffer: THREE.WebGLRenderTarget,
    readBuffer: THREE.WebGLRenderTarget
  ) {
    const uniforms = (this.fsQuad.material as THREE.ShaderMaterial).uniforms;

    uniforms.tColors.value = readBuffer.texture;
    uniforms.tGodRays.value = readBuffer.depthTexture;
    uniforms.fGodRayIntensity.value = 0.69;

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
    return new THREE.ShaderMaterial(GodRaysCombineShader);
  }
}
