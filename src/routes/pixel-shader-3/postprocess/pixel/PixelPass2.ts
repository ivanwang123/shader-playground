import * as THREE from "three";
import { WebGLRenderer, WebGLRenderTarget } from "three";
import { Pass, FullScreenQuad } from "three/examples/jsm/Addons.js";

export class PixelPass2 extends Pass {
  fsQuad: FullScreenQuad;
  resolution: THREE.Vector2;
  scene: THREE.Scene;
  camera: THREE.Camera;
  rgbRenderTarget: THREE.WebGLRenderTarget;

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
  }

  render(
    renderer: WebGLRenderer,
    writeBuffer: WebGLRenderTarget,
    readBuffer: WebGLRenderTarget
  ) {
    // console.log("PIXEL PASS 2 RENDER");
    // this.scene.children.forEach((child) => {
    //   if (child instanceof THREE.InstancedMesh) {
    //     child.material.colorWrite = true;
    //     child.material.depthWrite = true;
    //   }
    // });

    renderer.setRenderTarget(this.rgbRenderTarget);
    renderer.render(this.scene, this.camera);

    // @ts-ignore
    const uniforms = this.fsQuad.material.uniforms;
    uniforms.tDiffuse.value = this.rgbRenderTarget.texture;
    uniforms.tDepth.value = this.rgbRenderTarget.depthTexture;
    uniforms.tPrevDiffuse.value = readBuffer.texture;
    uniforms.tPrevDepth.value = readBuffer.depthTexture;

    if (this.renderToScreen) {
      renderer.setRenderTarget(null);
    } else {
      renderer.setRenderTarget(writeBuffer);
      if (this.clear) renderer.clear();
    }
    this.fsQuad.render(renderer);
  }

  material() {
    return new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        tDepth: { value: null },
        tPrevDiffuse: { value: null },
        tPrevDepth: { value: null },
        uInverseProjectionMatrix: {
          value: this.camera.projectionMatrixInverse,
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
      vertexShader: `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
                `,
      fragmentShader: `
uniform sampler2D tDiffuse;
uniform sampler2D tDepth;
uniform sampler2D tPrevDiffuse;
uniform sampler2D tPrevDepth;
uniform vec4 uResolution;
uniform mat4 uInverseProjectionMatrix;

varying vec2 vUv;

const float ditherMatrix[16] = float[](
    0.0,  0.5,  0.125, 0.625,
    0.75, 0.25, 0.875, 0.375,
    0.1875, 0.6875, 0.0625, 0.5625,
    0.9375, 0.4375, 0.8125, 0.3125
);

float getDitherValue(ivec2 pixelPos) {
    int index = (pixelPos.x % 4) + (pixelPos.y % 4) * 4;
    return ditherMatrix[index];
}

float getDepth(sampler2D depthTexture, vec2 uv) {
  float depth = texture2D(depthTexture, uv).r;
  vec3 ndc = vec3(uv * 2.0 - 1.0, depth);
  vec4 view = uInverseProjectionMatrix * vec4(ndc, 1.0);
  view.xyz /= view.w;
  return -view.z;
}

void main() {
  vec2 iuv = (floor(uResolution.xy * vUv) + 0.5) * uResolution.zw;
  vec4 texel;

  if (texture2D(tDepth, iuv).r < texture2D(tPrevDepth, iuv).r) {
    texel = texture2D(tDiffuse, iuv);
  } else {
    // texel = texture2D(tPrevDiffuse, iuv);
    texel = texture2D(tDiffuse, iuv);
  }

  float diff = 1.0;

  ivec2 pixelCoord = ivec2(gl_FragCoord.xy);
  float ditherValue = getDitherValue(pixelCoord);

  diff = floor(diff * 5.0 + ditherValue) / 5.0;

  gl_FragColor = texel * diff;
}
                `,
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
