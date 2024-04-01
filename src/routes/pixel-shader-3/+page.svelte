<script lang="ts">
  import {
    addCube,
    addGrass,
    addGround,
    addSphere,
    addTexture,
    addWaterfall,
  } from "./models/index";
  import { createScene } from "./createScene";
  import { onMount } from "svelte";
  import * as THREE from "three";
  import {
    EffectComposer,
    GammaCorrectionShader,
    OrbitControls,
    RenderPass,
    ShaderPass,
  } from "three/examples/jsm/Addons.js";
  import PixelPass from "./postprocess/pixel/PixelPass";
  import { addWater } from "./models/water/water";
  import { DEPTHLESS_LAYER } from "./constants";
  import { PixelPass2 } from "./postprocess/pixel/PixelPass2";
  import { RenderedTextures } from "./RenderedTextures";

  let canvas: HTMLCanvasElement;

  // Create scene
  const { scene, camera, topdownCamera, gui } = createScene();

  // Clock
  const clock = new THREE.Clock();

  // GUI
  const intensity = {
    value: 3,
  };

  // Resolution
  const resolution = new THREE.Vector2(
    window.innerWidth / intensity.value,
    window.innerHeight / intensity.value
  );

  // Models
  const ground = addGround();
  scene.add(ground);

  const cube = addCube();
  scene.add(cube);

  const sphere = addSphere({ position: new THREE.Vector3(2.5, 0, 1) });
  scene.add(sphere);

  // const water = addWater(camera);
  // scene.add(water);

  // const waterfall = addWaterfall({ position: new THREE.Vector3(-3, 5, 0) });
  // scene.add(waterfall);

  // const grass = addGrass(topdownCamera);
  // scene.add(grass);

  // const texture = addTexture(resolution);
  // scene.add(texture);

  onMount(() => {
    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      canvas,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.type = THREE.BasicShadowMap;
    renderer.shadowMap.enabled = true;

    // Rendered textures
    const renderedTextures = new RenderedTextures(
      renderer,
      scene,
      camera,
      topdownCamera,
      resolution
    );

    // Composer
    const composer = new EffectComposer(renderer);
    composer.setSize(window.innerWidth, window.innerHeight);

    const pixelPass = new PixelPass(resolution, camera, renderedTextures);
    const pixelPass2 = new PixelPass2(resolution, scene, camera);

    // texture.material.uniforms.tTexture.value =
    //   pixelPass.groundRenderTarget.depthTexture;

    composer.addPass(pixelPass);
    // composer.addPass(pixelPass2);
    // composer.addPass(new RenderPass(scene, camera));

    composer.addPass(new ShaderPass(GammaCorrectionShader));

    // Controls
    new OrbitControls(camera, renderer.domElement);

    // Animate
    const animate = () => {
      requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      renderedTextures.renderTextures();

      // grass.material.uniforms.uTime.value = elapsedTime;
      // waterfall.material.uniforms.uTime.value = elapsedTime;
      // water.material.uniforms.uTime.value = elapsedTime;

      // water.material.uniforms.tDiffuse.value =
      //   renderedTextures.diffuseDepthlessTexture;
      // water.material.uniforms.tDepth.value =
      //   renderedTextures.depthDepthlessTexture;

      composer.render();
    };
    animate();

    // Resize
    const resize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      topdownCamera.updateProjectionMatrix();

      composer.setSize(window.innerWidth, window.innerHeight);
    };
    resize();

    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
    };
  });
</script>

<canvas bind:this={canvas} />
