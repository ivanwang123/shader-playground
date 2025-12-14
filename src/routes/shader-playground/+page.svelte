<script lang="ts">
  import { CustomComposer } from "$lib/scenes/CustomComposer";
  import { CustomRenderer } from "$lib/scenes/CustomRenderer";
  import { addGround, addMonkey } from "$lib/scenes/addModels";
  import { createScene } from "$lib/scenes/createScene";
  import OutlinePass from "$lib/shaders/outline/OutlinePass";
  import { PixelShader } from "$lib/shaders/pixel/PixelShader";
  import PixelPass from "$lib/shaders/pixel2/PixelPass";
  import { onMount } from "svelte";
  import { FXAAShader } from "three/addons/shaders/FXAAShader.js";
  import { SMAAEdgesShader } from "three/addons/shaders/SMAAShader.js";
  import * as THREE from "three";
  import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";

  const shaders = [
    { id: "default", value: "default", label: "Default" },
    { id: "pixel", value: "pixel", label: "Pixelate" },
    { id: "outline", value: "outline", label: "Outline" },
  ] as const;

  type SelectedShader = (typeof shaders)[number]["value"];
  let selectedShader: SelectedShader = "default";

  let canvas: HTMLCanvasElement;

  let customRenderer: CustomRenderer | null;
  let customComposer: CustomComposer | null;

  $: {
    switch (selectedShader) {
      case "outline":
        if (customRenderer) {
          customRenderer.cancelAnimate();
          customRenderer.removeResizeListener();
        }
        if (customComposer) {
          customComposer.animate();
          customComposer.addResizeListener();
        }
        break;
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

  const { scene, camera, gui } = createScene({
    backgroundColor: 0xffffff,
  });

  addGround(scene);
  addMonkey(scene);

  onMount(() => {
    customRenderer = new CustomRenderer(canvas, scene, camera);
    customComposer = new CustomComposer(canvas, scene, camera);
    // const pixelShader = new PixelShader(customComposer);
    const intensity = {
      value: 1,
    };

    const resolution = new THREE.Vector2(
      window.innerWidth / intensity.value,
      window.innerHeight / intensity.value
    );
    // const pixelPass = new PixelPass(resolution, scene, camera);
    // customComposer.composer.addPass(pixelPass);

    const outlinePass = new OutlinePass(resolution, scene, camera);
    customComposer.composer.addPass(outlinePass);
    const fxaaPass = new ShaderPass(SMAAEdgesShader);
    fxaaPass.uniforms["resolution"].value.x = 1 / window.innerWidth;
    fxaaPass.uniforms["resolution"].value.x = 1 / window.innerWidth;
    customComposer.composer.addPass(fxaaPass);

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
