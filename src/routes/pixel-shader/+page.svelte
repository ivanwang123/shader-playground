<script lang="ts">
  import { onMount } from "svelte";
  import { ShaderPass } from "three/examples/jsm/Addons.js";
  import * as THREE from "three";

  import { createComposerScene } from "$lib/scenes/baseScene";
  import pixelVert from "./pixel.vert";
  import pixelFrag from "./pixel.frag";

  let canvas: HTMLCanvasElement;

  onMount(() => {
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

    const { scene, camera, renderer, composer, gui, resize } =
      createComposerScene(canvas, {
        resizeFunc: (renderer) => {
          pixelEffect.uniforms["uResolution"].value.x =
            renderer.domElement.width;
          pixelEffect.uniforms["uResolution"].value.y =
            renderer.domElement.height;
        },
      });

    const shaderFolder = gui.addFolder("Shader");
    shaderFolder
      .add(pixelEffectUniforms.uIntensity, "value", 0, 10, 1)
      .onChange(
        () =>
          (pixelEffect.uniforms.uIntensity.value =
            pixelEffectUniforms.uIntensity.value)
      )
      .name("intensityr");

    composer.addPass(pixelEffect);

    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
    };
  });
</script>

<canvas bind:this={canvas} />
