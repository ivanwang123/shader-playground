import { FullScreenQuad, Pass } from "three/examples/jsm/Addons.js";
import * as THREE from "three";

import pixelVert from "./pixel.vert";
import pixelFrag from "./pixel.frag";
import { DEPTHLESS_LAYER, GROUND_LAYER } from "../../constants";
import type { RenderedTextures } from "../../RenderedTextures";

export default class PixelPass extends Pass {
  resolution: THREE.Vector2;
  camera: THREE.Camera;
  renderedTextures: RenderedTextures;
  fsQuad: FullScreenQuad;

  // diffuseRenderTarget: THREE.WebGLRenderTarget;
  // diffuseDepthlessRenderTarget: THREE.WebGLRenderTarget;
  // groundRenderTarget: THREE.WebGLRenderTarget;
  // normalRenderTarget: THREE.WebGLRenderTarget;
  // depthTexture: THREE.DepthTexture;
  // normalMaterial: THREE.Material;

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

    // this.diffuseRenderTarget = this.createRenderTarget(
    //   resolution.x,
    //   resolution.y,
    //   false
    // );
    // this.diffuseDepthlessRenderTarget = this.createRenderTarget(
    //   resolution.x,
    //   resolution.y,
    //   true
    // );
    // this.groundRenderTarget = this.createRenderTarget(
    //   resolution.x,
    //   resolution.y,
    //   true
    // );
    // this.normalRenderTarget = this.createRenderTarget(
    //   resolution.x,
    //   resolution.y,
    //   true
    // );
    // this.depthTexture = this.normalRenderTarget.depthTexture;

    // this.normalMaterial = new THREE.MeshNormalMaterial();
  }

  render(renderer: THREE.WebGLRenderer, writeBuffer: THREE.WebGLRenderTarget) {
    // // Render without grass
    // this.camera.layers.disable(DEPTHLESS_LAYER);
    // renderer.setRenderTarget(this.diffuseRenderTarget);
    // renderer.render(this.scene, this.camera);
    // this.camera.layers.enable(DEPTHLESS_LAYER);

    // // Render with grass
    // renderer.setRenderTarget(this.diffuseDepthlessRenderTarget);
    // renderer.render(this.scene, this.camera);

    // // Render ground only from topdown
    // const groundLayer = new THREE.Layers();
    // groundLayer.set(GROUND_LAYER);
    // this.scene.children.forEach((child) => {
    //   if (child instanceof THREE.Mesh && !child.layers.test(groundLayer)) {
    //     child.material.colorWrite = false;
    //     child.material.depthWrite = false;
    //   }
    // });
    // renderer.setRenderTarget(this.groundRenderTarget);
    // renderer.render(this.scene, this.topdownCamera);
    // this.scene.children.forEach((child) => {
    //   if (child instanceof THREE.Mesh && !child.layers.test(groundLayer)) {
    //     child.material.colorWrite = true;
    //     child.material.depthWrite = true;
    //   }

    //   // if (child instanceof THREE.InstancedMesh) {
    //   //   child.material.uniforms["tGround"] = {
    //   //     value: this.groundRenderTarget.texture,
    //   //   };
    //   //   child.material.uniforms["tGroundDepth"] = {
    //   //     value: this.groundRenderTarget.depthTexture,
    //   //   };
    //   // }
    // });

    // // Render normal texture
    // this.camera.layers.disable(DEPTHLESS_LAYER);
    // const prevOverrideMaterial = this.scene.overrideMaterial;
    // renderer.setRenderTarget(this.normalRenderTarget);
    // this.scene.overrideMaterial = this.normalMaterial;
    // renderer.render(this.scene, this.camera);
    // this.scene.overrideMaterial = prevOverrideMaterial;
    // this.camera.layers.enable(DEPTHLESS_LAYER);

    this.renderedTextures.renderTextures();

    // Set uniforms
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
      // writeBuffer.depthTexture = this.normalRenderTarget.depthTexture;
      // writeBuffer.depthBuffer = true;
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
    });
  }

  // createRenderTarget(width: number, height: number, depthTexture: boolean) {
  //   const renderTarget = new THREE.WebGLRenderTarget(
  //     width,
  //     height,
  //     depthTexture
  //       ? {
  //           depthTexture: new THREE.DepthTexture(width, height),
  //           depthBuffer: true,
  //         }
  //       : undefined
  //   );
  //   renderTarget.texture.format = THREE.RGBAFormat;
  //   renderTarget.texture.minFilter = THREE.NearestFilter;
  //   renderTarget.texture.magFilter = THREE.NearestFilter;
  //   renderTarget.texture.generateMipmaps = false;
  //   renderTarget.stencilBuffer = false;
  //   return renderTarget;
  // }
}
