<script lang="ts">
  import { onMount } from "svelte";
  import * as THREE from "three";

  import PixelPass from "$lib/shaders/pixel2/PixelPass";
  import { createScene } from "$lib/scenes/createScene";
  import { createComposer } from "$lib/scenes/createRenderer";
  import {
    addCube,
    addGround,
    addMonkey,
    addSphere,
  } from "$lib/scenes/addModels";
  import {
    GammaCorrectionShader,
    ShaderPass,
  } from "three/examples/jsm/Addons.js";
  import PixelPass2 from "$lib/shaders/pixel2/PixelPass2";

  let canvas: HTMLCanvasElement;

  const { scene, camera, gui } = createScene();

  const intensity = {
    value: 3,
  };

  const resolution = new THREE.Vector2(
    window.innerWidth / intensity.value,
    window.innerHeight / intensity.value
  );

  onMount(() => {
    const { composer, resize } = createComposer(canvas, scene, camera);

    addGround(scene);
    addCube(scene);
    addSphere(scene);
    addMonkey(scene);

    const pixelPass = new PixelPass(resolution, scene, camera);
    // const pixelPass2 = new PixelPass2(resolution);
    composer.addPass(pixelPass);
    composer.addPass(new ShaderPass(GammaCorrectionShader));
    // composer.addPass(pixelPass2);

    const shaderFolder = gui.addFolder("Shader");
    shaderFolder
      .add(intensity, "value", 1, 10, 1)
      .name("intensity")
      .onChange(() => {
        pixelPass.rgbRenderTarget = pixelPass.createRenderTarget(
          window.innerWidth / intensity.value,
          window.innerHeight / intensity.value,
          false
        );
      });

    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
    };
  });
</script>

<canvas bind:this={canvas} />
