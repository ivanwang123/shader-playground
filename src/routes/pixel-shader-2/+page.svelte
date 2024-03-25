<script lang="ts">
  import { onMount } from "svelte";
  import * as THREE from "three";

  import PixelPass from "$lib/shaders/pixel2/PixelPass";
  import { createScene } from "$lib/scenes/createScene";
  import { createComposer } from "$lib/scenes/createRenderer";
  import {
    addCube,
    addGround,
    addMonkey,
    addSphere,
  } from "$lib/scenes/addModels";
  import {
    GammaCorrectionShader,
    GodRaysDepthMaskShader,
    RenderPass,
    ShaderPass,
  } from "three/examples/jsm/Addons.js";
  import PixelPass2 from "$lib/shaders/pixel2/PixelPass2";
  import toonColorFrag from "$lib/materials/toon/toonColor.frag";
  import { createToonMaterial } from "$lib/materials/toon/createToonMaterial";

  let canvas: HTMLCanvasElement;

  const { scene, camera, gui } = createScene();

  const intensity = {
    value: 3,
  };

  const resolution = new THREE.Vector2(
    window.innerWidth / intensity.value,
    window.innerHeight / intensity.value
  );

  onMount(() => {
    const { composer, resize } = createComposer(canvas, scene, camera);

    addGround(scene);
    addCube(scene);
    addSphere(scene);
    // addMonkey(scene);

    let uniforms: { [uniform: string]: THREE.IUniform<any> } = {
      ...THREE.UniformsLib.lights,
      uGlossiness: { value: 5 },
      uColor: { value: new THREE.Color(0x00ff00) },
    };

    // const grassGeometry = new THREE.PlaneGeometry(0.5, 1, 1, 1);
    const grassGeometry = new THREE.BoxGeometry(0.1, 0.5, 0.1);
    // grassGeometry.rotateX((Math.PI * 90) / 180);
    grassGeometry.translate(0, 0.2, 0);
    const grassMaterial = new THREE.ShaderMaterial({
      // vertexShader: `
      // 	varying vec2 vUv;
      // 	varying vec3 viewSpaceDir;
      // 	varying mat4 inverseProjectionMatrix;

      // 	void main() {
      // 		vUv = uv;
      // 		inverseProjectionMatrix = inverse(projectionMatrix);
      // 		viewSpaceDir = (inverseProjectionMatrix * vec4(position.xy, 0.0, 1.0)).xyz;

      // 		gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
      // 	}
      // `,
      vertexShader: `
			#include <common>
#include <shadowmap_pars_vertex>

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewDir;
varying vec3 vViewPosition;

void main() {
#include <beginnormal_vertex>
#include <defaultnormal_vertex>

#include <begin_vertex>

  // clang-format off
#include <worldpos_vertex>
#include <shadowmap_vertex>
  // clang-format on

  vec4 modelPosition = modelMatrix * vec4(position, 1.0);
  vec4 viewPosition = viewMatrix * modelPosition;
  vec4 clipPosition = projectionMatrix * viewPosition;

  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  vViewDir = normalize(-viewPosition.xyz);
  vViewPosition = viewPosition.xyz;

	gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
}
			`,
      fragmentShader: toonColorFrag,
      // fragmentShader: `
      // 	varying vec2 vUv;

      // 	void main() {
      // 		vec3 baseColor = vec3(0.41, 1.0, 0.5);
      // 		float clarity = (vUv.y * 0.5) + 0.5;
      // 		gl_FragColor = vec4(baseColor, 1.0);
      // 	}
      // `,
      // depthWrite: false,
      // depthTest: false,
      uniforms,
      lights: true,
    });

    const toon = createToonMaterial(new THREE.Color(0x00ff00));
    toon.side = THREE.DoubleSide;

    const instanceCount = 1000;
    const instancedGrass = new THREE.InstancedMesh(
      grassGeometry,
      // grassMaterial,
      new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        // colorWrite: false,
        // depthWrite: false,
      }),
      // toon,
      instanceCount
    );
    instancedGrass.castShadow = true;
    instancedGrass.receiveShadow = true;
    scene.add(instancedGrass);

    const dummyGrass = new THREE.Object3D();
    for (let i = 0; i < instanceCount; i++) {
      dummyGrass.position.set(
        (Math.random() - 0.5) * 10,
        0,
        (Math.random() - 0.5) * 10
      );
      dummyGrass.scale.setScalar(0.5 + Math.random() * 0.5);
      dummyGrass.rotation.y = (Math.random() * Math.PI) / 5;
      dummyGrass.castShadow = true;
      dummyGrass.updateMatrix();
      instancedGrass.setMatrixAt(i, dummyGrass.matrix);
    }

    const pixelPass = new PixelPass(resolution, scene, camera);
    // const pixelPass2 = new PixelPass2(resolution);
    composer.addPass(pixelPass);
    // composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new ShaderPass(GammaCorrectionShader));
    // composer.addPass(pixelPass2);

    const shaderFolder = gui.addFolder("Shader");
    shaderFolder
      .add(intensity, "value", 1, 10, 1)
      .name("intensity")
      .onChange(() => {
        pixelPass.rgbRenderTarget = pixelPass.createRenderTarget(
          window.innerWidth / intensity.value,
          window.innerHeight / intensity.value,
          false
        );
      });

    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
    };
  });
</script>

<canvas bind:this={canvas} />
