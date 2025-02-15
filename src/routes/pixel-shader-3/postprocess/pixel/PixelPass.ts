// import { FullScreenQuad, Pass } from "three/examples/jsm/Addons.js";
import * as THREE from "three";

import pixelVert from "./pixel.vert";
import pixelFrag from "./pixel.frag";
import type { RenderedTextures } from "../../RenderedTextures";
import { FullScreenQuad, Pass } from "three/examples/jsm/Addons.js";

export class PixelPass extends Pass {
  resolution: THREE.Vector2;
  camera: THREE.Camera;
  renderedTextures: RenderedTextures;
  fsQuad: FullScreenQuad;

  constructor(
    resolution: THREE.Vector2,
    camera: THREE.Camera,
    renderedTextures: RenderedTextures,
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
    readBuffer: THREE.WebGLRenderTarget,
  ) {
    const uniforms = (this.fsQuad.material as THREE.ShaderMaterial).uniforms;

    uniforms.tDiffuse.value = this.renderedTextures.diffuseDepthlessTexture;
    uniforms.tDepth.value = this.renderedTextures.depthDepthlessTexture;

    uniforms.tNormal.value = this.renderedTextures.normalDepthlessTexture;

    uniforms.tGrassDiffuse.value = this.renderedTextures.diffuseTexture;
    uniforms.tGrassDepth.value = this.renderedTextures.depthTexture;

    if (this.renderToScreen) {
      renderer.setRenderTarget(null);
    } else {
      renderer.setRenderTarget(writeBuffer);
      writeBuffer.depthTexture = readBuffer.texture as THREE.DepthTexture;
      writeBuffer.depthBuffer = true;
      if (this.clear) {
        renderer.clear();
      }
    }

    this.fsQuad.render(renderer);
  }

  material() {
    return new THREE.ShaderMaterial({
      vertexShader: pixelVert,
      fragmentShader: pixelFrag,
      uniforms: {
        tDiffuse: { value: null },
        tDepth: { value: null },
        tNormal: { value: null },
        tGrassDiffuse: { value: null },
        tGrassDepth: { value: null },
        // TODO: Get directional light direction
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
            1 / this.resolution.y,
          ),
        },
      },
    });
  }
}
