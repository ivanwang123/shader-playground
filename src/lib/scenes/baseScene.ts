import { GUI } from "lil-gui";
import {
  EffectComposer,
  GLTFLoader,
  OrbitControls,
  RenderPass,
} from "three/examples/jsm/Addons.js";
import * as THREE from "three";

// GUI
const gui = new GUI();

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xfef6c9);

// Camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 8;
camera.position.y = 8;

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 4, 3);
directionalLight.castShadow = true;
scene.add(directionalLight);

const directionalLightHelper = new THREE.DirectionalLightHelper(
  directionalLight,
  1
);
scene.add(directionalLightHelper);

// Lighting GUI
const directionalLightFolder = gui.addFolder("Directional Light");
directionalLightFolder
  .add(directionalLight.position, "x", -10, 10, 0.1)
  .onChange(() => directionalLightHelper.update());
directionalLightFolder
  .add(directionalLight.position, "y", -10, 10, 0.1)
  .onChange(() => directionalLightHelper.update());
directionalLightFolder
  .add(directionalLight.position, "z", -10, 10, 0.1)
  .onChange(() => directionalLightHelper.update());
directionalLightFolder.add(directionalLight, "intensity", 0, 10, 0.1);
directionalLightFolder.add(directionalLight, "castShadow");

const ambientLightFolder = gui.addFolder("Ambient Light");
ambientLightFolder.add(ambientLight, "intensity", 0, 10, 0.1);

// GLTF Loader
const gltfLoader = new GLTFLoader();

// Ground
const groundGeometry = new THREE.PlaneGeometry(10, 10);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0xceb1be });
const ground = new THREE.Mesh<any, any, any>(groundGeometry, groundMaterial);
ground.receiveShadow = true;
ground.rotateX(THREE.MathUtils.degToRad(-90));
scene.add(ground);

// Monkey
let monkey = await gltfLoader.loadAsync("/models/Monkey.glb");
monkey.scene.position.set(1, 1, 0);

monkey.scene.traverse((child) => {
  if (child instanceof THREE.Mesh) {
    child.material = new THREE.MeshStandardMaterial({
      color: child.material.color,
    });
    child.castShadow = true;
  }
});

scene.add(monkey.scene);

// Meshes
const sphereGeometry = new THREE.SphereGeometry(0.5);
const sphereMaterial = new THREE.MeshStandardMaterial({ color: 0x777da7 });
const sphere = new THREE.Mesh<any, any, any>(sphereGeometry, sphereMaterial);
sphere.position.y = 0.5;
sphere.castShadow = true;
scene.add(sphere);

const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
const cubeMaterial = new THREE.MeshStandardMaterial({ color: 0xff773d });
const cube = new THREE.Mesh<any, any, any>(cubeGeometry, cubeMaterial);
cube.position.x = 2;
cube.position.y = 0.5;
cube.castShadow = true;
console.log("CUBE", cube);
scene.add(cube);

// 0x777DA7
// 0x877B66

type Params = {
  animateFunc?: (renderer: THREE.WebGLRenderer) => void;
  resizeFunc?: (renderer: THREE.WebGLRenderer) => void;
};

const sceneExports = {
  scene,
  camera,
  gui,
};

export function createRendererScene(
  canvas: HTMLCanvasElement,
  params?: Params
) {
  // Renderer
  const renderer = createRenderer(canvas);

  // Animate
  const animate = () => {
    requestAnimationFrame(animate);
    cube.rotation.y = (cube.rotation.y % (2 * Math.PI)) + 0.01;
    if (params?.animateFunc) {
      params.animateFunc(renderer);
    }
    renderer.render(scene, camera);
  };
  animate();

  // Resize
  const resize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    if (params?.resizeFunc) {
      params.resizeFunc(renderer);
    }
  };
  resize();

  return {
    ...sceneExports,
    renderer,
    resize,
  };
}

export function createComposerScene(
  canvas: HTMLCanvasElement,
  params?: Params
) {
  // Renderer
  const renderer = createRenderer(canvas);

  // Composer
  const renderTarget = new THREE.WebGLRenderTarget(
    window.innerWidth,
    window.innerHeight
  );
  renderTarget.texture.format = THREE.RGBAFormat;
  renderTarget.texture.minFilter = THREE.NearestFilter;
  renderTarget.texture.magFilter = THREE.NearestFilter;
  renderTarget.texture.generateMipmaps = false;
  renderTarget.stencilBuffer = false;
  const composer = new EffectComposer(renderer, renderTarget);
  composer.setSize(window.innerWidth, window.innerHeight);
  composer.addPass(new RenderPass(scene, camera));

  // Animate
  const animate = () => {
    requestAnimationFrame(animate);
    cube.rotation.y = (cube.rotation.y % (2 * Math.PI)) + 0.01;
    if (params?.animateFunc) {
      params.animateFunc(renderer);
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
    if (params?.resizeFunc) {
      params.resizeFunc(renderer);
    }
  };
  resize();

  return {
    ...sceneExports,
    renderer,
    composer,
    resize,
  };
}

export function createRenderer(canvas: HTMLCanvasElement) {
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

export function getModels() {
  return {
    ground,
    sphere,
    cube,
    monkey,
  };
}

export function getScene() {
  return scene;
}

export function getCamera() {
  return camera;
}
