import { GUI } from "lil-gui";
import * as THREE from "three";

type Options = {
  backgroundColor?: THREE.ColorRepresentation;
  ambientLightIntensity?: number;
  directionalLightIntensity?: number;
  castShadow?: boolean;
};

const defaultOptions: Required<Options> = {
  backgroundColor: 0xfef6c9,
  ambientLightIntensity: 1,
  directionalLightIntensity: 1,
  castShadow: true,
};

export function createScene(options?: Options) {
  const userOptions = { ...defaultOptions, ...options };

  // GUI
  const gui = new GUI();

  // Scene
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(userOptions.backgroundColor);

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
  const ambientLight = new THREE.AmbientLight(
    0xffffff,
    userOptions.ambientLightIntensity
  );
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(
    0xffffff,
    userOptions.directionalLightIntensity
  );
  directionalLight.position.set(5, 4, 3);
  directionalLight.castShadow = userOptions.castShadow;
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

  return {
    scene,
    camera,
    gui,
  };
}
