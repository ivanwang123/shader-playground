<script lang="ts">
  import { onMount } from "svelte";
  import * as THREE from "three";

  import { createToonMaterial } from "$lib/materials/toon/createToonMaterial";
  import { createRenderer } from "$lib/scenes/createRenderer";
  import {
    addCube,
    addGround,
    addMonkey,
    addSphere,
  } from "$lib/scenes/addModels";
  import { createScene } from "$lib/scenes/createScene";
  import { CustomRenderer } from "$lib/scenes/CustomRenderer";

  let canvas: HTMLCanvasElement;

  const { scene, camera } = createScene();

  const monkeyTexture = new THREE.TextureLoader().load(
    "/textures/MonkeyTexture.png"
  );
  monkeyTexture.flipY = false;

  const monkeyMaterial = createToonMaterial(monkeyTexture);

  onMount(() => {
    (async () => {
      const monkey = await addMonkey(scene);

      monkey.scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material = monkeyMaterial;
          child.castShadow = true;
          child.userData["hasTexture"] = true;
          child.userData["texture"] = monkeyTexture;
        }
      });
    })();

    const sphere = addSphere(scene);
    sphere.material = createToonMaterial(new THREE.Color(0x777da7));

    const cube = addCube(scene);
    cube.material = createToonMaterial(new THREE.Color(0xff773d));

    addGround(scene);

    // const { resize } = createRenderer(canvas, scene, camera);
    const customRenderer = new CustomRenderer(canvas, scene, camera);
    customRenderer.animate();

    customRenderer.addResizeListener();

    return () => {
      customRenderer.removeResizeListener();
    };
  });
</script>

<canvas bind:this={canvas} />
