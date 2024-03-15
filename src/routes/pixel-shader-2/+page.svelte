<script lang="ts">
  import { onMount } from "svelte";
  import * as THREE from "three";

  import { createComposerScene } from "$lib/scenes/baseScene";
  import PixelPass from "./PixelPass";

  let canvas: HTMLCanvasElement;

  const intensity = {
    value: 3,
  };

  const resolution = new THREE.Vector2(
    window.innerWidth / intensity.value,
    window.innerHeight / intensity.value
  );

  onMount(() => {
    const { scene, camera, composer, gui, resize } =
      createComposerScene(canvas);

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
