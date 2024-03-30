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
    addPuddle,
    addSphere,
    addWaterfall,
  } from "$lib/scenes/addModels";
  import {
    GammaCorrectionShader,
    RenderPass,
    ShaderPass,
  } from "three/examples/jsm/Addons.js";
  import PixelPass2 from "$lib/shaders/pixel2/PixelPass2";
  import toonColorFrag from "$lib/materials/toon/toonColor.frag";
  import { createToonMaterial } from "$lib/materials/toon/createToonMaterial";
  import { Reflector } from "$lib/scenes/reflector";
  import { reflect } from "three/examples/jsm/nodes/Nodes.js";

  let canvas: HTMLCanvasElement;

  const { scene, camera, gui } = createScene();

  const clock = new THREE.Clock();

  const intensity = {
    value: 3,
  };

  const resolution = new THREE.Vector2(
    window.innerWidth / intensity.value,
    window.innerHeight / intensity.value
  );

  onMount(() => {
    addGround(scene);
    addCube(scene);
    addSphere(scene);
    const waterfall = addWaterfall(scene);
    const { puddle, water } = addPuddle(scene, camera);
    // addMonkey(scene);

    const reflectorGeometry = new THREE.PlaneGeometry(5, 5);
    const reflector = new Reflector(reflectorGeometry);
    reflector.position.set(0, 0, -2);
    scene.add(reflector);

    const topdownCamera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    // const topdownCamera = new THREE.OrthographicCamera(
    //   -window.innerWidth / 2,
    //   window.innerWidth / 2,
    //   window.innerHeight / 2,
    //   -window.innerHeight / 2,
    //   0.1,
    //   1000
    // );

    topdownCamera.position.set(0, 5, 0);
    topdownCamera.lookAt(new THREE.Vector3(0, 0, 0));
    topdownCamera.layers.enable(1);

    // (topdownCamera as THREE.PerspectiveCamera).aspect =
    //   window.innerWidth / window.innerHeight;
    (topdownCamera as THREE.PerspectiveCamera).updateProjectionMatrix();
    (topdownCamera as THREE.PerspectiveCamera).updateMatrixWorld();

    let uniforms: { [uniform: string]: THREE.IUniform<any> } = {
      ...THREE.UniformsLib.lights,
      uGlossiness: { value: 5 },
      uColor: { value: new THREE.Color(0x00ff00) },
      uTime: { value: 0 },
      uResolution: { value: resolution },
      uTopdownViewMatrix: { value: topdownCamera.matrixWorldInverse },
      uTopdownProjectionMatrix: { value: topdownCamera.projectionMatrix },
      tGround: { value: null },
    };

    // const grassGeometry = new THREE.PlaneGeometry(0.1, 0.5, 1, 4);
    const grassGeometry = new THREE.BoxGeometry(0.1, 0.5, 0.1);
    // grassGeometry.rotateX((Math.PI * 90) / 180);
    grassGeometry.translate(0, 0.2, 0);
    const grassMaterial = new THREE.ShaderMaterial({
      vertexShader: `
				uniform float uTime;

      	varying vec2 vUv;
				varying vec4 vWorldPosition;

      	void main() {
      		vUv = uv;
					vWorldPosition = instanceMatrix[3];

					// VERTEX POSITION
    
					vec4 mvPosition = vec4( position, 1.0 );
					mvPosition = instanceMatrix * mvPosition;
					
					// here the displacement is made stronger on the blades tips.
					float dispPower = 1.0 - cos( uv.y * 3.1416 / 2.0 );
					
					float displacement = sin( mvPosition.z + uTime * 2.0 ) * ( 0.08 * dispPower );
					mvPosition.z += displacement;
					
					vec4 modelViewPosition = modelViewMatrix * mvPosition;
					gl_Position = projectionMatrix * modelViewPosition;

      		// gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
      	}
      `,
      fragmentShader: `
				uniform sampler2D tGround;
				uniform mat4 uTopdownViewMatrix;
				uniform mat4 uTopdownProjectionMatrix;

      	varying vec2 vUv;
      	varying vec4 vWorldPosition;

      	void main() {
					vec4 clipPosition = uTopdownProjectionMatrix * uTopdownViewMatrix * vWorldPosition;
					vec2 ndc = clipPosition.xy / clipPosition.w;
					vec2 groundUV = ndc * 0.5 + 0.5;
					vec4 groundTexel = texture2D(tGround, groundUV);

      		vec3 baseColor = vec3(0.41, 1.0, 0.5);
      		float clarity = (vUv.y * 0.5) + 0.5;

      		gl_FragColor = vec4(groundTexel.rgb, 1.0);
      	}
      `,
      // depthWrite: false,
      // depthTest: false,
      uniforms,
      lights: true,
    });

    const instanceCount = 5000;
    const instancedGrass = new THREE.InstancedMesh(
      grassGeometry,
      grassMaterial,
      // new THREE.MeshBasicMaterial({
      //   color: 0x00ff00,
      //   colorWrite: false,
      //   depthWrite: false,
      // }),
      // toon,
      instanceCount
    );
    instancedGrass.layers.set(2);
    camera.layers.enable(2);
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
    const pixelPass2 = new PixelPass2(resolution, scene, camera);

    const { composer, resize } = createComposer(canvas, scene, camera, {
      animateFunc: () => {
        instancedGrass.material.uniforms.uTime.value = clock.getElapsedTime();
        instancedGrass.material.uniformsNeedUpdate = true;
        waterfall.material.uniforms.uTime.value = clock.getElapsedTime();
        water.material.uniforms.uTime.value = clock.getElapsedTime();
      },
    });

    // composer.addPass(pixelPass);

    water.material.uniforms.tDepth.value =
      pixelPass.normalRenderTarget.depthTexture;
    water.material.uniforms.tDiffuse.value = pixelPass.rgbRenderTarget.texture;
    // composer.addPass(pixelPass2);
    composer.addPass(new RenderPass(scene, camera));
    // composer.addPass(new ShaderPass(GammaCorrectionShader));
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
