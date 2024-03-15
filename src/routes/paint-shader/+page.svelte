<script lang="ts">
  import { onMount } from "svelte";
  import * as THREE from "three";

  import { createRendererScene, getModels } from "$lib/scenes/baseScene";

  let canvas: HTMLCanvasElement;

  onMount(() => {
    const { resize } = createRendererScene(canvas);

    const { monkey } = getModels();

    const textureLoader = new THREE.TextureLoader();

    textureLoader.load("/textures/MonkeyPaintNormal.png", (texture) => {
      texture.flipY = false;

      monkey.scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material = new THREE.MeshStandardMaterial({
            color: child.material.color,
            normalMap: texture,
            normalMapType: THREE.ObjectSpaceNormalMap,
          });
        }
      });
    });

    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
    };
  });
</script>

<canvas bind:this={canvas} />
