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
  // const camera = new THREE.PerspectiveCamera(
  //   75,
  //   window.innerWidth / window.innerHeight,
  //   0.1,
  //   1000
  // );
  // camera.position.z = 4;
  // camera.position.y = 4;
  // // camera.layers.disable(0);
  // camera.layers.enable(1);

  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  // camera = new THREE.OrthographicCamera(
  //   -window.innerWidth / 2,
  //   window.innerWidth / 2,
  //   window.innerHeight / 2,
  //   -window.innerHeight / 2,
  //   0.1,
  //   1000
  // );
  camera.position.set(0, 8, 8);
  camera.lookAt(new THREE.Vector3(0, 0, 0));
  camera.layers.enable(1);

  // Lighting
  const ambientLight = new THREE.AmbientLight(
    0xffffff,
    userOptions.ambientLightIntensity
  );
  ambientLight.layers.set(1);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(
    0xffffff,
    userOptions.directionalLightIntensity
  );
  directionalLight.position.set(-5, 4, 3);
  directionalLight.castShadow = userOptions.castShadow;
  directionalLight.layers.set(1);
  scene.add(directionalLight);

  const directionalLightHelper = new THREE.DirectionalLightHelper(
    directionalLight,
    1
  );
  scene.add(directionalLightHelper);

  const pointLight = new THREE.PointLight(0xff0000, 10);
  pointLight.position.set(2, 2, 0);
  pointLight.castShadow = true;
  pointLight.layers.set(1);
  scene.add(pointLight);

  const pointLightHelper = new THREE.PointLightHelper(pointLight, 0.1);
  scene.add(pointLightHelper);

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

  const pointLightFolder = gui.addFolder("Point Light");
  pointLightFolder
    .add(pointLight.position, "x", -10, 10, 0.1)
    .onChange(() => pointLightHelper.update());
  pointLightFolder
    .add(pointLight.position, "y", -10, 10, 0.1)
    .onChange(() => pointLightHelper.update());
  pointLightFolder
    .add(pointLight.position, "z", -10, 10, 0.1)
    .onChange(() => pointLightHelper.update());
  pointLightFolder.add(pointLight, "intensity", 0, 10, 0.1);

  const ambientLightFolder = gui.addFolder("Ambient Light");
  ambientLightFolder.add(ambientLight, "intensity", 0, 10, 0.1);

  return {
    scene,
    camera,
    gui,
  };
}
