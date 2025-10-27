import { GUI } from "lil-gui";
import * as THREE from "three";
import { GROUND_LAYER } from "./constants";

type Options = {
  backgroundColor?: THREE.ColorRepresentation;
  ambientLightIntensity?: number;
  directionalLightIntensity?: number;
  castShadow?: boolean;
};

const defaultOptions: Required<Options> = {
  backgroundColor: 0xfef6c9,
  ambientLightIntensity: 0,
  directionalLightIntensity: 0,
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
  camera.position.set(0, 8, 8);
  camera.layers.enableAll();
  camera.lookAt(new THREE.Vector3(0, 0, 0));

  // Topdown camera
  // const topdownCamera = new THREE.PerspectiveCamera(
  //   75,
  //   window.innerWidth / window.innerHeight,
  //   0.1,
  //   1000
  // );
  const topdownCamera = new THREE.OrthographicCamera(
    -window.innerWidth / 60,
    window.innerWidth / 60,
    window.innerHeight / 60,
    -window.innerHeight / 60,
    0.1,
    1000
  );
  topdownCamera.position.set(0, 5, 0);
  topdownCamera.lookAt(new THREE.Vector3(0, 0, 0));
  topdownCamera.layers.enableAll();
  (topdownCamera as THREE.OrthographicCamera).updateProjectionMatrix();
  (topdownCamera as THREE.OrthographicCamera).updateMatrixWorld();

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
  directionalLight.position.set(-5, 4, 3);
  directionalLight.castShadow = userOptions.castShadow;
  scene.add(directionalLight);

  const directionalLightHelper = new THREE.DirectionalLightHelper(
    directionalLight,
    1
  );
  scene.add(directionalLightHelper);

  // const directionalLight2 = new THREE.DirectionalLight(
  //   0xffffff,
  //   userOptions.directionalLightIntensity
  // );
  // directionalLight2.position.set(-5, 4, 3);
  // directionalLight2.castShadow = userOptions.castShadow;
  // scene.add(directionalLight2);

  // const directionalLightHelper2 = new THREE.DirectionalLightHelper(
  //   directionalLight2,
  //   1
  // );
  // scene.add(directionalLightHelper2);

  const pointLight = new THREE.PointLight(0xff0000, 10);
  pointLight.position.set(2, 2, 0);
  pointLight.castShadow = true;
  scene.add(pointLight);

  const pointLightHelper = new THREE.PointLightHelper(pointLight, 0.1);
  scene.add(pointLightHelper);

  const pointLight2 = new THREE.PointLight(0x0000ff, 10);
  pointLight2.position.set(0, 2, 0);
  pointLight2.castShadow = true;
  scene.add(pointLight2);

  const pointLightHelper2 = new THREE.PointLightHelper(pointLight2, 0.1);
  scene.add(pointLightHelper2);

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
  directionalLightFolder
    .add(directionalLight, "intensity", 0, 1, 0.01)
    .setValue(0.01);
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
  pointLightFolder.add(pointLight, "intensity", 0, 10, 0.1).setValue(3);

  const pointLightFolder2 = gui.addFolder("Point Light 2");
  pointLightFolder2
    .add(pointLight2.position, "x", -10, 10, 0.1)
    .onChange(() => pointLightHelper2.update());
  pointLightFolder2
    .add(pointLight2.position, "y", -10, 10, 0.1)
    .onChange(() => pointLightHelper2.update());
  pointLightFolder2
    .add(pointLight2.position, "z", -10, 10, 0.1)
    .onChange(() => pointLightHelper2.update());
  pointLightFolder2.add(pointLight2, "intensity", 0, 10, 0.1).setValue(3);

  const ambientLightFolder = gui.addFolder("Ambient Light");
  ambientLightFolder.add(ambientLight, "intensity", 0, 1, 0.01).setValue(0.01);

  return {
    scene,
    camera,
    topdownCamera,
    gui,
    pointLight,
    pointLight2,
  };
}
