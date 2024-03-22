<script lang="ts">
  import { CustomComposer } from "$lib/scenes/CustomComposer";
  import { CustomRenderer } from "$lib/scenes/CustomRenderer";
  import { addGround, addMonkey } from "$lib/scenes/addModels";
  import { createScene } from "$lib/scenes/createScene";
  import { PixelShader } from "$lib/shaders/pixel/PixelShader";
  import PixelPass from "$lib/shaders/pixel2/PixelPass";
  import { onMount } from "svelte";
  import * as THREE from "three";

  const shaders = [
    { id: "default", value: "default", label: "Default" },
    { id: "pixel", value: "pixel", label: "Pixelate" },
  ] as const;

  type SelectedShader = (typeof shaders)[number]["value"];
  let selectedShader: SelectedShader = "pixel";

  let canvas: HTMLCanvasElement;

  let customRenderer: CustomRenderer | null;
  let customComposer: CustomComposer | null;

  $: {
    switch (selectedShader) {
      case "pixel":
        if (customRenderer) {
          customRenderer.cancelAnimate();
          customRenderer.removeResizeListener();
        }
        if (customComposer) {
          customComposer.animate();
          customComposer.addResizeListener();
        }
        break;
      default:
        if (customComposer) {
          customComposer.cancelAnimate();
          customComposer.removeResizeListener();
        }
        if (customRenderer) {
          customRenderer.animate();
          customRenderer.addResizeListener();
        }
    }
  }

  const { scene, camera, gui } = createScene();

  addGround(scene);
  addMonkey(scene);

  onMount(() => {
    customRenderer = new CustomRenderer(canvas, scene, camera);
    customComposer = new CustomComposer(canvas, scene, camera);
    // const pixelShader = new PixelShader(customComposer);
    const intensity = {
      value: 3,
    };

    const resolution = new THREE.Vector2(
      window.innerWidth / intensity.value,
      window.innerHeight / intensity.value
    );
    const pixelPass = new PixelPass(resolution, scene, camera);
    customComposer.composer.addPass(pixelPass);

    // customComposer.animate();
    // customComposer.addResizeListener();
    // customRenderer.animate();
    // customRenderer.addResizeListener();

    return () => {
      // customComposer.removeResizeListener();
      // customRenderer.removeResizeListener();
    };
  });
</script>

<canvas bind:this={canvas} />

<div class="absolute left-0 top-0 bg-white">
  <div>
    <h6 class="font-bold">Shader</h6>
    {#each shaders as shader}
      <div>
        <input
          type="radio"
          id={shader.id}
          name="shader"
          value={shader.value}
          bind:group={selectedShader}
        />
        <label for={shader.id}>{shader.label}</label>
      </div>
    {/each}
  </div>
</div>
