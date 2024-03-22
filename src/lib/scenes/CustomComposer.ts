import * as THREE from "three";

import { createBaseRenderer } from "./createRenderer";
import {
  EffectComposer,
  GammaCorrectionShader,
  RenderPass,
  ShaderPass,
} from "three/examples/jsm/Addons.js";

type Options = {
  animateFunc?: (renderer: THREE.WebGLRenderer) => void;
  resizeFunc?: (renderer: THREE.WebGLRenderer) => void;
};

export class CustomComposer {
  canvas: HTMLCanvasElement;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  options: Options;
  renderer: THREE.WebGLRenderer;
  composer: EffectComposer;

  animateId: number;
  resizeListener: () => void;

  constructor(
    canvas: HTMLCanvasElement,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    options?: Options
  ) {
    this.canvas = canvas;
    this.scene = scene;
    this.camera = camera;
    this.options = options || {};
    this.renderer = createBaseRenderer(canvas, camera);

    this.composer = new EffectComposer(this.renderer);
    this.composer.setSize(window.innerWidth, window.innerHeight);
    // this.composer.addPass(new RenderPass(scene, camera));
    // this.composer.addPass(new ShaderPass(GammaCorrectionShader));

    this.animateId = 0;
    this.resizeListener = () => {};
  }

  animate() {
    const animation = () => {
      this.animateId = requestAnimationFrame(animation);

      if (this.options.animateFunc) {
        this.options.animateFunc(this.renderer);
      }
      this.composer.render();
    };
    animation();
  }

  cancelAnimate() {
    cancelAnimationFrame(this.animateId);
  }

  addResizeListener() {
    this.resizeListener = () => {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.composer.setSize(window.innerWidth, window.innerHeight);
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();

      if (this.options.resizeFunc) {
        this.options.resizeFunc(this.renderer);
      }
    };
    this.resizeListener();

    window.addEventListener("resize", this.resizeListener);
  }

  removeResizeListener() {
    window.removeEventListener("resize", this.resizeListener);
  }
}
