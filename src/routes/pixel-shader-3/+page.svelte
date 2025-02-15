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
    GodRaysDepthMaskShader,
    MeshSurfaceSampler,
    OrbitControls,
    RenderPass,
    ShaderPass,
  } from "three/examples/jsm/Addons.js";
  import { PixelPass } from "./postprocess/pixel/PixelPass";
  import { GodrayPass1 } from "./postprocess/godray/GodrayPass1";
  import { GodrayPass2 } from "./postprocess/godray/GodrayPass2";
  import { addWater } from "./models/water/water";
  import { DEPTHLESS_LAYER } from "./constants";
  import { PixelPass2 } from "./postprocess/pixel/PixelPass2";
  import { RenderedTextures } from "./RenderedTextures";
  import { Reflector } from "./models/reflector/reflector";
  import { DisplayPass } from "./postprocess/display/DisplayPass";
  import { GodrayPass0 } from "./postprocess/godray/GodrayPass0";

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

  const cube = addCube({ position: new THREE.Vector3(1, 0.5, 1) });
  scene.add(cube);

  const sphere = addSphere({ position: new THREE.Vector3(2.5, 0.5, 1) });
  scene.add(sphere);

  const water = addWater(camera);
  scene.add(water);
  // water.position.z = 6;

  // const waterfall = addWaterfall({ position: new THREE.Vector3(-3, 5, 0) });
  // scene.add(waterfall);

  const groundSampler = new MeshSurfaceSampler(ground)
    .setWeightAttribute(null)
    .build();

  const grass = addGrass(topdownCamera, groundSampler);
  // scene.add(grass);

  const texture = addTexture(resolution, camera);
  // scene.add(texture);

  const reflectorGeometry = new THREE.PlaneGeometry(10, 10);

  // const reflector = new Reflector(reflectorGeometry);
  // reflector.position.set(7, 5, 0);
  // reflector.rotation.y = THREE.MathUtils.degToRad(-90);
  // scene.add(reflector);

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

    // composer.addPass(new GodrayPass0(resolution, camera, renderedTextures));
    // composer.addPass(new GodrayPass1(resolution, camera, renderedTextures));
    // composer.addPass(new DisplayPass(resolution, camera, renderedTextures));
    composer.addPass(pixelPass);
    // composer.addPass(new GodrayPass2(resolution, camera, renderedTextures));

    // composer.addPass(pixelPass2);

    composer.addPass(new ShaderPass(GammaCorrectionShader));

    // Controls
    new OrbitControls(camera, renderer.domElement);

    // Animate
    const animate = () => {
      requestAnimationFrame(animate);

      // Elapsed time
      const elapsedTime = clock.getElapsedTime();

      // Reset textures
      renderedTextures.resetTextures();

      // Set uniforms

      grass.material.uniforms.uTime.value = elapsedTime;
      grass.material.uniforms.tGround.value =
        renderedTextures.groundDiffuseTexture;
      // grass.material.uniforms.tGroundDepth.value =
      //   renderedTextures.groundDepthTexture;

      water.material.uniforms.uTime.value = elapsedTime;
      water.material.uniforms.tRealDiffuse.value =
        renderedTextures.diffuseDepthlessTexture;
      water.material.uniforms.tRealDepth.value =
        renderedTextures.depthDepthlessTexture;

      // texture.material.uniforms.tTexture.value = reflector.renderTarget.texture;

      // waterfall.material.uniforms.uTime.value = elapsedTime;

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
