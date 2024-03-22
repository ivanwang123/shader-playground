import * as THREE from "three";

import { createBaseRenderer } from "./createRenderer";

type Options = {
  animateFunc?: (renderer: THREE.WebGLRenderer) => void;
  resizeFunc?: (renderer: THREE.WebGLRenderer) => void;
};

export class CustomRenderer {
  canvas: HTMLCanvasElement;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  options: Options;
  renderer: THREE.WebGLRenderer;

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

    this.animateId = 0;
    this.resizeListener = () => {};
  }

  animate() {
    const animation = () => {
      this.animateId = requestAnimationFrame(animation);
      if (this.options.animateFunc) {
        this.options.animateFunc(this.renderer);
      }
      this.renderer.render(this.scene, this.camera);
    };
    animation();
  }

  cancelAnimate() {
    cancelAnimationFrame(this.animateId);
  }

  addResizeListener() {
    this.resizeListener = () => {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
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
