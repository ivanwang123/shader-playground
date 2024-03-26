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
  topdownCamera: THREE.Camera;
  fsQuad: FullScreenQuad;
  rgbRenderTarget: THREE.WebGLRenderTarget;
  normalRenderTarget: THREE.WebGLRenderTarget;
  groundRenderTarget: THREE.WebGLRenderTarget;
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

    this.topdownCamera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    // this.topdownCamera = new THREE.OrthographicCamera(
    //   -window.innerWidth / 2,
    //   window.innerWidth / 2,
    //   window.innerHeight / 2,
    //   -window.innerHeight / 2,
    //   0.1,
    //   1000
    // );
    this.topdownCamera.position.set(0, 5, 0);
    this.topdownCamera.lookAt(new THREE.Vector3(0, 0, 0));
    this.topdownCamera.layers.enable(1);
    // (this.topdownCamera as THREE.OrthographicCamera).updateProjectionMatrix();
    // (this.topdownCamera as THREE.PerspectiveCamera).aspect =
    // window.innerWidth / window.innerHeight;
    (this.topdownCamera as THREE.PerspectiveCamera).updateProjectionMatrix();
    (this.topdownCamera as THREE.PerspectiveCamera).updateMatrixWorld();
    // (this.topdownCamera as THREE.PerspectiveCamera).updateMatrix();

    this.rgbRenderTarget = this.createRenderTarget(
      resolution.x,
      resolution.y,
      false
    );
    this.normalRenderTarget = this.createRenderTarget(
      resolution.x,
      resolution.y,
      true
    );
    this.groundRenderTarget = this.createRenderTarget(
      resolution.x,
      resolution.y,
      false
    );

    this.normalMaterial = new THREE.MeshNormalMaterial();
  }

  render(renderer: THREE.WebGLRenderer, writeBuffer: THREE.WebGLRenderTarget) {
    // console.log("PIXEL PASS RENDER");
    renderer.setRenderTarget(this.rgbRenderTarget);
    renderer.render(this.scene, this.camera);

    // Remove all objects from scene
    const invisibleLayer = new THREE.Layers();
    invisibleLayer.set(0);
    this.scene.children.forEach((child) => {
      if (child instanceof THREE.Mesh && child.layers.test(invisibleLayer)) {
        child.material.colorWrite = false;
        child.material.depthWrite = false;
      }
    });
    renderer.setRenderTarget(this.groundRenderTarget);
    renderer.render(this.scene, this.topdownCamera);
    this.scene.children.forEach((child) => {
      if (
        (child instanceof THREE.Mesh || child instanceof THREE.InstancedMesh) &&
        child.layers.test(invisibleLayer)
      ) {
        child.material.colorWrite = true;
        child.material.depthWrite = true;
      }

      if (child instanceof THREE.InstancedMesh) {
        child.material.uniforms["tGround"] = {
          value: this.groundRenderTarget.texture,
        };
      }
    });

    this.camera.layers.disable(2);
    const prevOverrideMaterial = this.scene.overrideMaterial;
    renderer.setRenderTarget(this.normalRenderTarget);
    this.scene.overrideMaterial = this.normalMaterial;
    renderer.render(this.scene, this.camera);
    this.scene.overrideMaterial = prevOverrideMaterial;
    this.camera.layers.enable(2);

    const uniforms = (this.fsQuad.material as THREE.ShaderMaterial).uniforms;
    uniforms.tDiffuse.value = this.rgbRenderTarget.texture;
    uniforms.tDepth.value = this.normalRenderTarget.depthTexture;
    uniforms.tNormal.value = this.normalRenderTarget.texture;
    uniforms.tGround.value = this.groundRenderTarget.texture;

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
        tGround: { value: null },
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
