import { EffectComposer, ShaderPass } from "three/examples/jsm/Addons.js";
import * as THREE from "three";
import type GUI from "lil-gui";

import { createComposerScene } from "$lib/scenes/baseScene";
import pixelVert from "./pixel.vert";
import pixelFrag from "./pixel.frag";
import { createComposer } from "$lib/scenes/createRenderer";

export function pixelShader(
  canvas: HTMLCanvasElement,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  gui: GUI
) {
  const pixelEffectUniforms = {
    uResolution: {
      value: new THREE.Vector2(),
    },
    uIntensity: { value: 5.0 },
    tDiffuse: {
      value: null,
    },
  };

  const pixelEffect = new ShaderPass({
    name: "PixelShader",
    vertexShader: pixelVert,
    fragmentShader: pixelFrag,
    uniforms: pixelEffectUniforms,
  });
  pixelEffect.renderToScreen = true;

  const { renderer, composer, resize } = createComposer(canvas, scene, camera, {
    resizeFunc: (renderer) => {
      pixelEffect.uniforms["uResolution"].value.x = renderer.domElement.width;
      pixelEffect.uniforms["uResolution"].value.y = renderer.domElement.height;
    },
  });

  composer.renderTarget1.texture.minFilter = THREE.NearestFilter;
  composer.renderTarget1.texture.magFilter = THREE.NearestFilter;
  composer.renderTarget2.texture.minFilter = THREE.NearestFilter;
  composer.renderTarget2.texture.magFilter = THREE.NearestFilter;

  const shaderFolder = gui.addFolder("Shader");
  shaderFolder
    .add(pixelEffectUniforms.uIntensity, "value", 0, 10, 1)
    .onChange(
      () =>
        (pixelEffect.uniforms.uIntensity.value =
          pixelEffectUniforms.uIntensity.value)
    )
    .name("intensity");

  composer.addPass(pixelEffect);

  return {
    renderer,
    composer,
    resize,
  };
}
