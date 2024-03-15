<script lang="ts">
  import { onMount } from "svelte";
  import * as THREE from "three";

  import PixelPass from "./PixelPass";
  import { createScene } from "$lib/scenes/createScene";
  import { createComposer } from "$lib/scenes/createRenderer";
  import { addGround, addMonkey } from "$lib/scenes/addModels";

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
    addMonkey(scene);

    const pixelPass = new PixelPass(resolution, scene, camera);
    composer.addPass(pixelPass);

    const shaderFolder = gui.addFolder("Shader");
    shaderFolder
      .add(intensity, "value", 1, 10, 1)
      .name("intensity")
      .onChange(() => {
        pixelPass.renderTarget = pixelPass.createRenderTarget(
          window.innerWidth / intensity.value,
          window.innerHeight / intensity.value
        );
      });

    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
    };
  });
</script>

<canvas bind:this={canvas} />
