<!-- 
	TODO
	[ ] Switch between shaders
	[ ] Switch between materials
	[ ] Save model and controls settings in localstorage
-->

<script lang="ts">
  import { onMount } from "svelte";
  import { GLTFLoader, type GLTF } from "three/examples/jsm/Addons.js";
  import * as THREE from "three";
  import { createScene } from "$lib/scenes/createScene";
  import { createComposer, createRenderer } from "$lib/scenes/createRenderer";
  import {
    addCube,
    addGround,
    addMonkey,
    addSphere,
  } from "$lib/scenes/addModels";
  import { pixelShader } from "../pixel-shader/pixelShader";
  import { useToonMaterial } from "../toon-shader/createToonMaterial";

  const shaders = [
    { id: "default-shader", value: "default", label: "Default" },
    { id: "pixel", value: "pixel", label: "Pixel" },
  ];

  const materials = [
    { id: "standard", value: "standard", label: "Standard" },
    { id: "toon", value: "toon", label: "Toon" },
  ];

  let selectedShader: string;
  let selectedMaterial: string;

  let canvas: HTMLCanvasElement;
  let fileInput: HTMLInputElement;

  const { scene, camera, gui } = createScene();

  const gltfLoader = new GLTFLoader();

  let model: GLTF | null = null;

  let meshes: THREE.Mesh<any, any, any>[] = [];

  function handleLoadModel(e: Event) {
    const files = (e.target as HTMLInputElement).files;
    if (files && files.length) {
      const modelFile = files[0];
      const url = URL.createObjectURL(modelFile);
      gltfLoader.load(url, (data) => {
        if (model) {
          scene.remove(model.scene);
        }

        model = data;
        model.scene.castShadow = true;
        model!.scene.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = model!.scene.castShadow;
            child.userData["color"] = child.material.color;
            meshes.push(child);
          }
        });

        useToonMaterial(meshes);

        scene.add(model.scene);
        URL.revokeObjectURL(url);

        const modelFolder = gui.addFolder("Model");
        modelFolder.add(model.scene.position, "x", -10, 10, 0.1);
        modelFolder.add(model.scene.position, "y", -10, 10, 0.1);
        modelFolder.add(model.scene.position, "z", -10, 10, 0.1);
        modelFolder.add(model.scene, "castShadow").onChange(() => {
          model!.scene.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.castShadow = model!.scene.castShadow;
            }
          });
        });
      });
    }
  }

  function removeModel() {
    if (model) {
      scene.remove(model.scene);
    }
    model = null;
  }

  $: {
    switch (selectedShader) {
      case "pixel":
        pixelShader(canvas, scene, camera, gui);
        break;
      default:
        createRenderer(canvas, scene, camera);
    }
  }

  $: {
    switch (selectedMaterial) {
      case "toon":
        useToonMaterial(meshes);
        break;
      default:
        meshes.forEach((mesh) => {
          let material: THREE.Material | null = null;
          if (mesh.material.name.includes("Outline")) {
            material = new THREE.MeshBasicMaterial({
              color: mesh.userData["color"] || new THREE.Color(0x000000),
            });
          } else if (mesh.userData["color"]) {
            material = new THREE.MeshStandardMaterial({
              color: mesh.userData["color"],
            });
          } else {
            material = new THREE.MeshStandardMaterial({
              color: new THREE.Color(0xffffff),
            });
          }
          mesh.material = material;
        });
    }
  }

  onMount(() => {
    const { resize } = pixelShader(canvas, scene, camera, gui);

    addGround(scene);

    window.addEventListener("resize", resize);

    return () => {
      window.addEventListener("resize", resize);
    };
  });
</script>

<canvas bind:this={canvas} />
<div class="absolute left-0 top-0 bg-white">
  <input
    type="file"
    accept=".gltf,.glb"
    bind:this={fileInput}
    on:change={handleLoadModel}
  />
  <button type="button" on:click={removeModel}>Clear</button>
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
  <div>
    <h6 class="font-bold">Material</h6>
    {#each materials as material}
      <div>
        <input
          type="radio"
          id={material.id}
          name="material"
          value={material.value}
          bind:group={selectedMaterial}
        />
        <label for={material.id}>{material.label}</label>
      </div>
    {/each}
  </div>
</div>
