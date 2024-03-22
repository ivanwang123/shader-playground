import { EffectComposer, ShaderPass } from "three/examples/jsm/Addons.js";
import * as THREE from "three";
import type GUI from "lil-gui";

import pixelVert from "./pixel.vert";
import pixelFrag from "./pixel.frag";
import { createComposer } from "$lib/scenes/createRenderer";
import type { CustomComposer } from "$lib/scenes/CustomComposer";

export class PixelShader {
  customComposer: CustomComposer;

  constructor(customComposer: CustomComposer) {
    this.customComposer = customComposer;

    const pixelEffectUniforms = {
      uResolution: {
        value: new THREE.Vector2(),
      },
      uIntensity: { value: 3.0 },
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

    customComposer.options.resizeFunc = (renderer: THREE.WebGLRenderer) => {
      pixelEffect.uniforms["uResolution"].value.x = renderer.domElement.width;
      pixelEffect.uniforms["uResolution"].value.y = renderer.domElement.height;
    };

    customComposer.composer.renderTarget1.texture.minFilter =
      THREE.NearestFilter;
    customComposer.composer.renderTarget1.texture.magFilter =
      THREE.NearestFilter;
    customComposer.composer.renderTarget2.texture.minFilter =
      THREE.NearestFilter;
    customComposer.composer.renderTarget2.texture.magFilter =
      THREE.NearestFilter;

    customComposer.composer.addPass(pixelEffect);
  }
}
