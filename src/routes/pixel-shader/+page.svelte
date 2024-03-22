<script lang="ts">
  import { onMount } from "svelte";
  import { RenderPass, ShaderPass } from "three/examples/jsm/Addons.js";
  import * as THREE from "three";

  import pixelVert from "$lib/shaders/pixel/pixel.vert";
  import pixelFrag from "$lib/shaders/pixel/pixel.frag";
  import { createScene } from "$lib/scenes/createScene";
  import { createComposer } from "$lib/scenes/createRenderer";
  import { addGround, addMonkey } from "$lib/scenes/addModels";
  import { CustomComposer } from "$lib/scenes/CustomComposer";

  let canvas: HTMLCanvasElement;

  const { scene, camera, gui } = createScene();

  addMonkey(scene);
  addGround(scene);

  onMount(() => {
    const pixelEffectUniforms = {
      uResolution: {
        value: new THREE.Vector2(),
      },
      uIntensity: { value: 5.0 },
      tDiffuse: {
        value: null,
      },
    };

    const pixelEffect = new ShaderPass({
      name: "PixelShader",
      vertexShader: pixelVert,
      fragmentShader: pixelFrag,
      uniforms: pixelEffectUniforms,
    });
    pixelEffect.renderToScreen = true;

    const customComposer = new CustomComposer(canvas, scene, camera, {
      resizeFunc: (renderer) => {
        pixelEffect.uniforms["uResolution"].value.x = renderer.domElement.width;
        pixelEffect.uniforms["uResolution"].value.y =
          renderer.domElement.height;
      },
    });
    customComposer.animate();

    // const { composer, resize } = createComposer(canvas, scene, camera, {
    //   resizeFunc: (renderer) => {
    //     pixelEffect.uniforms["uResolution"].value.x = renderer.domElement.width;
    //     pixelEffect.uniforms["uResolution"].value.y =
    //       renderer.domElement.height;
    //   },
    // });

    customComposer.composer.renderTarget1.texture.minFilter =
      THREE.NearestFilter;
    customComposer.composer.renderTarget1.texture.magFilter =
      THREE.NearestFilter;
    customComposer.composer.renderTarget2.texture.minFilter =
      THREE.NearestFilter;
    customComposer.composer.renderTarget2.texture.magFilter =
      THREE.NearestFilter;

    const shaderFolder = gui.addFolder("Shader");
    shaderFolder
      .add(pixelEffectUniforms.uIntensity, "value", 0, 10, 1)
      .onChange(
        () =>
          (pixelEffect.uniforms.uIntensity.value =
            pixelEffectUniforms.uIntensity.value)
      )
      .name("intensity");

    customComposer.composer.addPass(pixelEffect);

    customComposer.addResizeListener();

    return () => {
      customComposer.removeResizeListener();
    };
  });
</script>

<canvas bind:this={canvas} />
