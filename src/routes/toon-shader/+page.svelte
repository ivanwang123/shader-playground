<script lang="ts">
  import { onMount } from "svelte";
  import * as THREE from "three";

  import { createRendererScene, getModels } from "$lib/scenes/baseScene";
  import { createToonMaterial } from "./createToonMaterial";

  let canvas: HTMLCanvasElement;

  const monkeyTexture = new THREE.TextureLoader().load(
    "/textures/MonkeyTexture.png"
  );
  monkeyTexture.flipY = false;

  const monkeyMaterial = createToonMaterial(monkeyTexture);

  onMount(() => {
    const { monkey, sphere, cube } = getModels();

    monkey.scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = monkeyMaterial;
        child.castShadow = true;
        child.userData["hasTexture"] = true;
        child.userData["texture"] = monkeyTexture;
      }
    });

    const sphereMaterial = createToonMaterial(new THREE.Color(0x777da7));
    sphere.material = sphereMaterial;

    const cubeMaterial = createToonMaterial(new THREE.Color(0xff773d));
    cube.material = cubeMaterial;

    const { resize } = createRendererScene(canvas);

    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
    };
  });
</script>

<canvas bind:this={canvas} />
