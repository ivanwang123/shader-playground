import {
  EffectComposer,
  OrbitControls,
  RenderPass,
} from "three/examples/jsm/Addons.js";
import * as THREE from "three";

type Options = {
  animateFunc?: (renderer: THREE.WebGLRenderer) => void;
  resizeFunc?: (renderer: THREE.WebGLRenderer) => void;
};

export function createRenderer(
  canvas: HTMLCanvasElement,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  options?: Options
) {
  // Renderer
  const renderer = createBaseRenderer(canvas, camera);

  // Animate
  const animate = () => {
    requestAnimationFrame(animate);
    if (options?.animateFunc) {
      options.animateFunc(renderer);
    }
    renderer.render(scene, camera);
  };
  animate();

  // Resize
  const resize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    if (options?.resizeFunc) {
      options.resizeFunc(renderer);
    }
  };
  resize();

  return {
    renderer,
    resize,
  };
}

export function createComposer(
  canvas: HTMLCanvasElement,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  options?: Options
) {
  // Renderer
  const renderer = createBaseRenderer(canvas, camera);

  // Composer
  const composer = new EffectComposer(renderer);
  composer.setSize(window.innerWidth, window.innerHeight);
  composer.addPass(new RenderPass(scene, camera));

  // Animate
  const animate = () => {
    requestAnimationFrame(animate);
    if (options?.animateFunc) {
      options.animateFunc(renderer);
    }
    composer.render();
  };
  animate();

  // Resize
  const resize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    composer.setSize(window.innerWidth, window.innerHeight);
    if (options?.resizeFunc) {
      options.resizeFunc(renderer);
    }
  };
  resize();

  return {
    renderer,
    composer,
    resize,
  };
}

function createBaseRenderer(
  canvas: HTMLCanvasElement,
  camera: THREE.PerspectiveCamera
) {
  // Renderer
  const renderer = new THREE.WebGLRenderer({
    antialias: false,
    canvas,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.type = THREE.BasicShadowMap;
  renderer.shadowMap.enabled = true;

  // Controls
  new OrbitControls(camera, renderer.domElement);

  return renderer;
}
