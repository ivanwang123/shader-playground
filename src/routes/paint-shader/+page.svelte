<script lang="ts">
  import { addGround, addMonkey } from "$lib/scenes/addModels";
  import { createRenderer } from "$lib/scenes/createRenderer";
  import { createScene } from "$lib/scenes/createScene";
  import { onMount } from "svelte";
  import * as THREE from "three";

  let canvas: HTMLCanvasElement;

  const { scene, camera, gui } = createScene();

  onMount(() => {
    const { resize } = createRenderer(canvas, scene, camera);

    (async () => {
      const monkey = await addMonkey(scene);

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
    })();

    addGround(scene);

    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
    };
  });
</script>

<canvas bind:this={canvas} />
